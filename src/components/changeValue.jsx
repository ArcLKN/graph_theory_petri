import { useState } from "react";

export function ChangeValue({ setDialogBoxIsOpen, value, onChange }) {
	const [inputValue, setInputValue] = useState(0);

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
			<div className='bg-white rounded-lg shadow-lg p-6 w-96'>
				<h2 className='text-xl font-semibold mb-4'>Enter Value</h2>
				<div className='mb-4'>
					<label className='block text-sm font-medium text-gray-700 mb-2'>
						Value:
					</label>
					<input
						type='number'
						className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
						autoFocus
						onChange={(e) => Number(e.target.value)}
					/>
				</div>
				<div className='flex justify-end gap-3'>
					<button
						className='px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400'
						onClick={() => {
							setDialogBoxIsOpen(false);
						}}
					>
						Cancel
					</button>
					<button
						className='px-4 py-2 bg-blue-500 text-gray-800 rounded hover:bg-blue-600'
						onClick={() => setDialogBoxIsOpen(false)}
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}
