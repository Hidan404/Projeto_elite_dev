export default function SeatMap({ seats, selected, onSelect }) {
  const fileiras = [...new Set(seats.map((s) => s.fileira))].sort()

  return (
    <div className="seat-map">
      {fileiras.map((f) => (
        <div key={f} className="seat-row">
          <span className="seat-row-label">{f}</span>
          {seats
            .filter((s) => s.fileira === f)
            .sort((a, b) => a.numero - b.numero)
            .map((s) => {
              const ocupado = s.status === 'reservado' || s.status === 'vendido'
              const selecionado = selected.includes(s.id)
              return (
                <button
                  key={s.id}
                  className={`seat ${ocupado ? 'vendido' : ''} ${selecionado ? 'selected' : ''}`}
                  disabled={ocupado}
                  onClick={() => onSelect(s.id)}
                  title={`${s.fileira}${s.numero}`}
                >
                  {s.numero}
                </button>
              )
            })}
        </div>
      ))}
      <div className="legend">
        <div className="legend-item">
          <span className="seat" style={{ cursor: 'default' }}>1</span> Disponível
        </div>
        <div className="legend-item">
          <span className="seat vendido" style={{ cursor: 'default' }}>2</span> Ocupado
        </div>
        <div className="legend-item">
          <span className="seat selected" style={{ cursor: 'default' }}>3</span> Selecionado
        </div>
      </div>
    </div>
  )
}