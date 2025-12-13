import { useState } from "react";
import { ChangeValue } from "./components/changeValue";
import { Button } from "./components/ui/button";
import { Hand, HandGrab } from "lucide-react";

function addPlace(setPlaces) {
	// Logic to add a place to the Pétri Network
	setPlaces((prevPlaces) => [
		...prevPlaces,
		{
			id: Date.now(),
			x: Math.random() * 400 + 50,
			y: Math.random() * 300 + 50,
		},
	]);
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
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
	const [selectedElement, setSelectedElement] = useState(null);
	const [placingPlace, setPlacingPlace] = useState(false);
	const [places, setPlaces] = useState([]);
	const [transitions, setTransitions] = useState([]);
	const [arcs, setArcs] = useState([]);
	const [movingPlaceId, setMovingPlaceId] = useState(null);

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
								setPlacingPlace(!placingPlace);
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
				<div
					className='Canvas border border-gray-400 w-full h-[500px] bg-white rounded-2xl'
					onMouseMove={(e) => {
						const rect = e.currentTarget.getBoundingClientRect();
						setMousePos({
							x: e.clientX,
							y: e.clientY,
						});
					}}
					onClick={() => {
						if (!placingPlace && !movingPlaceId) return;

						if (
							movingPlaceId
						) {
							setPlaces((prev) =>
								prev.map((place) =>
									place.id === movingPlaceId
										? {
											...place,
											x: mousePos.x - 16,
											y: mousePos.y - 16,
										}
										: place
								)
							);
							setMovingPlaceId(null);
							return;
						} else if (placingPlace) {

							setPlaces((prev) => [
								...prev,
								{
									id: Date.now(),
									x: mousePos.x - 16,
									y: mousePos.y - 16,
								},
							]);

							setPlacingPlace(false);
						}
					}}
				>
					{/* Canvas for drawing Pétri Network will go here */}
					{(placingPlace || movingPlaceId) && (
						<div
							className='absolute w-8 h-8 rounded-full border-2 border-dashed border-black bg-white opacity-70 pointer-events-none'
							style={{
								left: mousePos.x - 16,
								top: mousePos.y - 16,
							}}
						/>
					)}
					{places.map((place) => (
						<div>
							{place.id === selectedElement && (
								<Button
									variant="outline"
									size="icon"
									className="absolute"
									style={{ left: place.x, top: place.y - 40 }}
									onClick={() => {
										setMovingPlaceId(
											movingPlaceId === place.id ? null : place.id
										);
									}}
								>
									{
										movingPlaceId === place.id ? <HandGrab /> : <Hand />
									}
								</Button>
							)}

							<div
								key={place.id}
								className={`absolute w-8 h-8 rounded-full hover:border-2 hover:border-blue-500 ${selectedElement === place.id
									? "bg-blue-500"
									: "bg-gray-500"
									}`}
								style={{ left: place.x, top: place.y }}
								onClick={() => {
									setSelectedElement(selectedElement === place.id ? null : place.id);
								}}
							></div>
						</div>
					))}
				</div>
			</div>
		</>
	);
}

export default App;
