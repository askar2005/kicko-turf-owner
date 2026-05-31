import { useState } from 'react';

interface Booking {
  turf: string;
  user: string;
  slot: string;
  amount: number;
  status: string;
}

export default function AdminBookingTable({ bookings }: { bookings: Booking[] }) {
  const [search, setSearch] = useState('');

  const filtered = bookings.filter(b =>
    b.turf.toLowerCase().includes(search.toLowerCase()) ||
    b.user.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold">Bookings</h3>
        <input
          placeholder="Search turf / user"
          className="border px-3 py-2 rounded-lg"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="w-full text-sm">
        <thead className="text-left border-b">
          <tr>
            <th>Turf</th>
            <th>User</th>
            <th>Slot</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((b, i) => (
            <tr key={i} className="border-b last:border-none">
              <td>{b.turf}</td>
              <td>{b.user}</td>
              <td>{b.slot}</td>
              <td>₹{b.amount}</td>
              <td className="text-green-600">{b.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
