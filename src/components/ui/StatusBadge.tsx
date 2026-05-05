export type Status = 'pending' | 'confirmed' | 'cancelled'

const styles: Record<Status, string> = {
  pending:   'bg-sand text-charcoal',
  confirmed: 'bg-leaf/20 text-charcoal',
  cancelled: 'bg-muted/10 text-muted',
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  )
}
