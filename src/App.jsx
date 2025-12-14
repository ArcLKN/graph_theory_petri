import { useState } from "react";
import { ChangeValueDialogBox } from "./components/changeValue";
import { Button } from "./components/ui/button";
import {
	ButtonGroup,
	ButtonGroupSeparator,
	ButtonGroupText,
} from "@/components/ui/button-group"
import { Hand, HandGrab, Eraser, Settings } from "lucide-react";

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

function addTransition(setTransitions, mousePos) {
	// Logic to add a transition to the Pétri Network
	setTransitions((prevTransitions) => [
		...prevTransitions,
		{
			id: Date.now(),
			x: mousePos.x - 20, // Ajuste pour centrer le rectangle
			y: mousePos.y - 30,
			width: 20, // largeur du rectangle
			height: 60, // hauteur du rectangle
		},
	]);
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
	const [movingPlaceId, setMovingPlaceId] = useState(null);

	const [arcs, setArcs] = useState([]);
	const [creatingArc, setCreatingArc] = useState(false);
	const [arcStartPlaceId, setArcStartPlaceId] = useState(null);
	const [editingArcEnd, setEditingArcEnd] = useState(null);

	const [placingTransition, setPlacingTransition] = useState(false);
	const [transitions, setTransitions] = useState([]);

	const selectedArc = arcs.find((a) => a.id === selectedElement) || null;


	return (
		<>
			{isDialogBoxOpen && (
				<ChangeValueDialogBox
					setDialogBoxIsOpen={setDialogBoxIsOpen}
					selectedId={selectedElement}
					setPlaces={setPlaces}
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
						<button
							className='bg-gray-200'
							onClick={() => setPlacingTransition(!placingTransition)}
						>
							Add Transition
						</button>
						<button className='bg-gray-200' onClick={() => {
							setCreatingArc(!creatingArc);
							setArcStartPlaceId(null);
						}
						}>
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
						<button className='bg-red-400' onClick={() => {
							setArcs([]);
						}}>
							Delete Arcs
						</button>
						<button className='bg-red-400' onClick={() => {
							setPlaces([]);
							setArcs([]);
							setTransitions([]);
						}}>
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
									value: 0,
								},
							]);

							setPlacingPlace(false);
						} else if (placingTransition) {
							addTransition(setTransitions, mousePos);
							setPlacingTransition(false);
							return;
						}
					}}
				>
					{/* Canvas for drawing Pétri Network will go here */}
					<svg className="absolute inset-0 w-full h-full pointer-events-none">
						{arcs.map((arc) => {
							const fromPlace = places.find((p) => p.id === arc.from);
							const toPlace = places.find((p) => p.id === arc.to);
							if (!fromPlace || !toPlace) return null;

							return (<line
								key={arc.id}
								x1={fromPlace.x + 16}
								y1={fromPlace.y + 16}
								x2={toPlace.x + 16}
								y2={toPlace.y + 16}
								stroke="black"
								strokeWidth="2"
								pointerEvents="stroke"
								onClick={() => {
									console.log("Arc clicked:", arc.id);
									setSelectedElement(arc.id);
								}}
							/>);
						})}
						{creatingArc && arcStartPlaceId && (
							(() => {
								const fromPlace = places.find((p) => p.id === arcStartPlaceId);
								if (!fromPlace) return null;
								return (<line
									x1={fromPlace.x + 16}
									y1={fromPlace.y + 16}
									x2={mousePos.x}
									y2={mousePos.y}
									stroke="black"
									strokeWidth="2"
								/>);
							})()
						)}
						{transitions.map((transition) => (
							<rect
								key={transition.id}
								x={transition.x}
								y={transition.y}
								width={transition.width}
								height={transition.height}
								fill={selectedElement === transition.id ? "blue" : "gray"}
								stroke="black"
								strokeWidth="2"
								onClick={(e) => {
									e.stopPropagation(); // empêche de déclencher le click du canvas
									setSelectedElement(transition.id);
								}}
							/>
						))}
						{placingTransition && (
							<rect
								x={mousePos.x - 20}
								y={mousePos.y - 30}
								width={20}
								height={60}
								fill="rgba(0,0,0,0.2)" // rectangle fantôme pendant le placement
								stroke="black"
								strokeWidth="2"
								pointerEvents="none"
							/>
						)}
					</svg>

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
						<div key={place.id}>
							{place.id === selectedElement && (
								<ButtonGroup orientation="horizontal" className="absolute w-fit" style={{ left: place.x - 40, top: place.y - 50 }}>
									<Button
										variant="outline"
										size="icon"
										onClick={() => {
											setDialogBoxIsOpen(true);
										}}
									>
										<Settings />
									</Button>
									<Button
										variant="outline"
										size="icon"
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
									<Button
										variant="outline"
										className="bg-red-300 hover:bg-red-300"
										size="icon"
										onClick={() => {
											// Delete place
											setPlaces((prev) =>
												prev.filter((p) => p.id !== place.id)
											);
											setSelectedElement(null);
										}}
									>
										<Eraser />
									</Button>
								</ButtonGroup>
							)}

							<div
								key={place.id}
								className={`absolute flex items-center justify-center w-8 h-8 rounded-full hover:border-2 hover:border-blue-500 ${selectedElement === place.id
									? "bg-blue-500"
									: "bg-gray-500"
									}`}
								style={{ left: place.x, top: place.y }}
								onClick={() => {
									if (creatingArc && arcStartPlaceId === null) {
										setArcStartPlaceId(place.id);
										return;
									}

									if (creatingArc && arcStartPlaceId !== null) {
										if (place.id !== arcStartPlaceId) {
											setArcs((prev) => [
												...prev,
												{
													id: Date.now(),
													from: arcStartPlaceId,
													to: place.id,
												},
											]);
										}

										setCreatingArc(false);
										setArcStartPlaceId(null);
										return;
									}

									setSelectedElement(selectedElement === place.id ? null : place.id);
								}}
							><p className="text-white pointer-events-none">{place.value}</p></div>
						</div>
					))}
					{selectedArc && (
						<>
							<Button
								variant="outline"
								className="absolute text-blue-500"
								size="icon"
								style={{
									left:
										places.find(p => p.id === selectedArc.from).x,
									top:
										places.find(p => p.id === selectedArc.from).y,
								}}
								onClick={() =>
									setEditingArcEnd({
										arcId: selectedArc.id,
										end: "from",
									})
								}
							>
								◉
							</Button>
						</>
					)}
				</div>
			</div>
		</>
	);
}

export default App;
