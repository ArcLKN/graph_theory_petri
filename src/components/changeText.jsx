import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function ChangeTextDialogBox({
	setDialogBoxIsOpen,
	previousText,
	onSave,
}) {
	const [inputText, setInputText] = useState(previousText);

	useEffect(() => {
		setInputText(previousText);
	}, [previousText]);

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
			<div className='bg-white rounded-lg shadow-lg p-6 w-96'>
				<h2 className='text-xl font-semibold mb-4'>Enter Text</h2>

				<div className='mb-4'>
					<label className='block text-sm font-medium text-gray-700 mb-2'>
						Text:
					</label>
					<input
						type='text'
						className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
						autoFocus
						value={inputText}
						onChange={(e) => setInputText(e.target.value)}
					/>
				</div>

				<div className='flex justify-end gap-3'>
					<Button
						className='px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400'
						onClick={() => setDialogBoxIsOpen(false)}
					>
						Cancel
					</Button>

					<Button
						className='px-4 py-2 bg-blue-500 text-gray-800 rounded hover:bg-blue-600'
						onClick={() => {
							onSave(inputText);
							setDialogBoxIsOpen(false);
						}}
					>
						Save
					</Button>
				</div>
			</div>
		</div>
	);
}