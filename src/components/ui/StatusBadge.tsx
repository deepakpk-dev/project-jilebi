export type Status = 'pending' | 'confirmed' | 'cancelled'

const styles: Record<Status, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${styles[status]}`}>
      {status}
    </span>
  )
}
