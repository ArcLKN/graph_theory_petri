import { useState } from "react";
import { ChangeValue } from "./components/changeValue";

function addPlace() {
	// Logic to add a place to the Pétri Network
}

function addTransition() {
	// Logic to add a transition to the Pétri Network
}

function addArc() {
	// Logic to add an arc to the Pétri Network
}

function addAnnotation() {
	// Logic to add an annotation to the Pétri Network
}

function App() {
	const [isDialogBoxOpen, setDialogBoxIsOpen] = useState(false);
	const [inputValue, setInputValue] = useState(1);
	const [doSimulation, setDoSimulation] = useState(false);

	return (
		<>
			{isDialogBoxOpen && (
				<ChangeValue
					setDialogBoxIsOpen={setDialogBoxIsOpen}
					value={inputValue}
					onChange={setInputValue}
				/>
			)}
			<div className='App px-16 py-4 space-y-4'>
				<div>
					<h1 className='text-xl font-bold'>Pétri Network Maker</h1>
				</div>
				<div className='Menu'>
					<div className='flex flex-row items-start space-x-4'>
						<button
							className='bg-gray-200'
							onClick={() => {
								null;
							}}
						>
							Add Place
						</button>
						<button className='bg-gray-200' onClick={null}>
							Add Transition
						</button>
						<button className='bg-gray-200' onClick={null}>
							Add Arc
						</button>
						<button className='bg-gray-200' onClick={null}>
							Add Annotation
						</button>
						<button
							className='bg-blue-300 '
							onClick={() => setDoSimulation(!doSimulation)}
						>
							{doSimulation
								? "Stop Simulation"
								: "Start Simulation"}
						</button>
						<button className='bg-red-300' onClick={null}>
							Delete Element
						</button>
						<button className='bg-red-400' onClick={null}>
							Delete Arcs
						</button>
						<button className='bg-red-400' onClick={null}>
							Delete All
						</button>
					</div>
				</div>
				<div className='Canvas border border-gray-400 w-full h-[500px] bg-white rounded-2xl'>
					{/* Canvas for drawing Pétri Network will go here */}
				</div>
			</div>
		</>
	);
}

export default App;
