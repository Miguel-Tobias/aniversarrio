import { useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type GiftImportRow,
  type GuestImportRow,
  type ImportValidationError,
  downloadGiftsTemplate,
  downloadGuestsTemplate,
  importGiftsToSupabase,
  importGuestsToSupabase,
  parseSpreadsheetFile,
  validateGiftRows,
  validateGuestRows,
} from '../../lib/spreadsheetImport'

type Kind = 'guests' | 'gifts'

type Props = {
  kind: Kind
  sb: SupabaseClient
  existingIds: string[]
  onDone: () => void | Promise<void>
}

const copy: Record<
  Kind,
  {
    title: string
    hint: string
    previewCols: (row: GuestImportRow | GiftImportRow) => string[]
    previewHeaders: string[]
  }
> = {
  guests: {
    title: 'Importar planilha de convidados',
    hint: 'Envie um CSV ou Excel (.xlsx) com as colunas Nome e Ordem (opcional: Id). Linhas com o mesmo Id atualizam o convidado existente.',
    previewHeaders: ['Nome', 'Ordem', 'Id'],
    previewCols: (row) => {
      const g = row as GuestImportRow
      return [g.name, String(g.sort_order), g.id]
    },
  },
  gifts: {
    title: 'Importar planilha de presentes',
    hint: 'Envie um CSV ou Excel (.xlsx) com Título, Descrição, Preço e Ordem (opcional: Id, Imagem com link do Google Drive ou URL). Presentes com o mesmo Id são atualizados — o Id não deve ser alterado se já houver pagamentos.',
    previewHeaders: ['Título', 'Preço', 'Ordem', 'Id'],
    previewCols: (row) => {
      const g = row as GiftImportRow
      return [
        g.title,
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
          g.price,
        ),
        String(g.sort_order),
        g.id,
      ]
    },
  },
}

export function SpreadsheetUpload({ kind, sb, existingIds, onDone }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const meta = copy[kind]
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<(GuestImportRow | GiftImportRow)[]>(
    [],
  )
  const [validationErrors, setValidationErrors] = useState<ImportValidationError[]>(
    [],
  )
  const [parseError, setParseError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setFileName(null)
    setParsedRows([])
    setValidationErrors([])
    setParseError(null)
    setImportError(null)
    setImportResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const onFile = async (file: File | undefined) => {
    reset()
    if (!file) return
    setBusy(true)
    try {
      const { headers, rows } = await parseSpreadsheetFile(file)
      if (rows.length === 0) {
        setParseError('A planilha está vazia.')
        return
      }
      const validated =
        kind === 'guests'
          ? validateGuestRows(headers, rows)
          : validateGiftRows(headers, rows)
      setFileName(file.name)
      setParsedRows(validated.rows)
      setValidationErrors(validated.errors)
      if (validated.rows.length === 0 && validated.errors.length > 0) {
        setParseError('Nenhuma linha válida para importar.')
      }
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Não foi possível ler o arquivo.')
    } finally {
      setBusy(false)
    }
  }

  const onImport = async () => {
    if (parsedRows.length === 0) return
    setBusy(true)
    setImportError(null)
    setImportResult(null)
    try {
      const idSet = new Set(existingIds)
      const result =
        kind === 'guests'
          ? await importGuestsToSupabase(
              sb,
              parsedRows as GuestImportRow[],
              idSet,
            )
          : await importGiftsToSupabase(sb, parsedRows as GiftImportRow[], idSet)

      const parts: string[] = []
      if (result.inserted > 0) parts.push(`${result.inserted} adicionado(s)`)
      if (result.updated > 0) parts.push(`${result.updated} atualizado(s)`)
      setImportResult(
        parts.length > 0
          ? `Importação concluída: ${parts.join(', ')}.`
          : 'Nenhum registro importado.',
      )
      if (result.errors.length > 0) {
        setImportError(result.errors.slice(0, 5).join(' '))
      }
      await onDone()
      if (result.errors.length === 0) reset()
    } catch (e) {
      setImportError(
        e instanceof Error ? e.message : 'Não foi possível importar a planilha.',
      )
    } finally {
      setBusy(false)
    }
  }

  const preview = parsedRows.slice(0, 8)
  const more = parsedRows.length - preview.length

  return (
    <div className="admin-import">
      <h3 className="admin-h3">{meta.title}</h3>
      <p className="admin-section__hint admin-import__hint">{meta.hint}</p>

      <div className="admin-import__actions">
        <button
          type="button"
          className="admin-btn-ghost"
          onClick={() =>
            kind === 'guests' ? downloadGuestsTemplate() : downloadGiftsTemplate()
          }
        >
          Baixar modelo (CSV)
        </button>
        <label className="admin-btn-primary admin-import__file-label">
          {busy && !fileName ? 'Lendo arquivo…' : 'Escolher planilha'}
          <input
            ref={inputRef}
            className="admin-import__file-input"
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            disabled={busy}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </label>
        {fileName ? (
          <button type="button" className="admin-btn-ghost" onClick={reset} disabled={busy}>
            Limpar
          </button>
        ) : null}
      </div>

      {parseError ? (
        <div className="alert" role="alert">
          {parseError}
        </div>
      ) : null}

      {validationErrors.length > 0 ? (
        <div className="alert" role="alert">
          <strong>Avisos na planilha:</strong>
          <ul className="admin-import__error-list">
            {validationErrors.slice(0, 8).map((err) => (
              <li key={`${err.line}-${err.message}`}>
                Linha {err.line}: {err.message}
              </li>
            ))}
          </ul>
          {validationErrors.length > 8 ? (
            <p className="admin-muted">…e mais {validationErrors.length - 8} aviso(s).</p>
          ) : null}
        </div>
      ) : null}

      {parsedRows.length > 0 ? (
        <>
          <p className="admin-muted">
            Arquivo: <strong>{fileName}</strong> — {parsedRows.length} linha(s) pronta(s)
            para importar.
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--compact">
              <thead>
                <tr>
                  {meta.previewHeaders.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => (
                  <tr key={row.id}>
                    {meta.previewCols(row).map((cell, i) => (
                      <td key={`${row.id}-${i}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {more > 0 ? (
            <p className="admin-muted">…e mais {more} linha(s) na planilha.</p>
          ) : null}
          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-btn-primary"
              disabled={busy}
              onClick={() => void onImport()}
            >
              {busy ? 'Importando…' : `Importar ${parsedRows.length} registro(s)`}
            </button>
          </div>
        </>
      ) : null}

      {importResult ? (
        <p className="admin-import__success" role="status">
          {importResult}
        </p>
      ) : null}
      {importError ? (
        <div className="alert" role="alert">
          {importError}
        </div>
      ) : null}
    </div>
  )
}
