interface Props {
  etiqueta: string
  unidad?: string
  valor: string
  onChange: (valor: string) => void
  aviso?: string
  autoFocus?: boolean
}

/** Campo numérico que acepta coma o punto decimal y muestra el aviso amarillo debajo. */
export default function CampoNumero({ etiqueta, unidad, valor, onChange, aviso, autoFocus }: Props) {
  return (
    <label className={`campo ${aviso ? 'con-aviso' : ''}`}>
      <span className="campo-etiqueta">{etiqueta}</span>
      <span className="campo-entrada">
        <input inputMode="decimal" value={valor} onChange={(e) => onChange(e.target.value)} autoFocus={autoFocus} />
        {unidad && <span className="unidad">{unidad}</span>}
      </span>
      {aviso && <span className="aviso">⚠ {aviso}</span>}
    </label>
  )
}
