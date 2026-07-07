import { useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type GuestImportRow,
  type ImportValidationError,
  downloadGuestsTemplate,
  importGuestsToSupabase,
  parseSpreadsheetFile,
  validateGuestRows,
} from '../../lib/spreadsheetImport'

type Props = {
  sb: SupabaseClient
  existingIds: string[]
  onDone: () => void | Promise<void>
}

export function SpreadsheetUpload({ sb, existingIds, onDone }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<GuestImportRow[]>([])
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
      const validated = validateGuestRows(headers, rows)
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
      const result = await importGuestsToSupabase(sb, parsedRows, idSet)

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
      <h3 className="admin-h3">Importar planilha de convidados</h3>
      <p className="admin-section__hint admin-import__hint">
        Envie um CSV ou Excel (.xlsx) com as colunas Nome e Ordem (opcional: Id).
        Linhas com o mesmo Id atualizam o convidado existente.
      </p>

      <div className="admin-import__actions">
        <button type="button" className="admin-btn-ghost" onClick={() => downloadGuestsTemplate()}>
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
                  <th>Nome</th>
                  <th>Ordem</th>
                  <th>Id</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.sort_order}</td>
                    <td>{row.id}</td>
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
