import { useState } from "react";
import { ChangeValueDialogBox } from "./components/changeValue";
import { Button } from "./components/ui/button";
import {
	ButtonGroup,
	ButtonGroupSeparator,
	ButtonGroupText,
} from "@/components/ui/button-group"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
	const [arcStartId, setArcStartId] = useState(null);
	const [arcStartType, setArcStartType] = useState(null);
	const [editingArcEnd, setEditingArcEnd] = useState(null);

	const [placingTransition, setPlacingTransition] = useState(false);
	const [transitions, setTransitions] = useState([]);

	const selectedArc = arcs.find((a) => a.id === selectedElement) || null;
	const selectedTransition = transitions.find(t => t.id === selectedElement);


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
						<ButtonGroup>
							<Button
								className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
								onClick={() => {
									setPlacingPlace(!placingPlace);
								}}
							>
								Add Place
							</Button>
							<Button
								className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
								onClick={() => setPlacingTransition(!placingTransition)}
							>
								Add Transition
							</Button>
							<Button
								className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
								onClick={() => {
									setCreatingArc(!creatingArc);
									setArcStartId(null);
								}
								}>
								Add Arc
							</Button>
							<Button
								className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
								onClick={null}>
								Add Annotation
							</Button>
							<Button
								className='bg-blue-300 text-foreground hover:bg-blue-400  hover:text-accent-foreground'
								onClick={() => setDoSimulation(!doSimulation)}
							>
								{doSimulation
									? "Stop Simulation"
									: "Start Simulation"}
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" className="bg-blue-300 text-foreground hover:bg-blue-400  hover:text-accent-foreground">More</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuLabel>Simulation</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => { }}>X</DropdownMenuItem>
									<DropdownMenuItem onClick={() => { }}>Y</DropdownMenuItem>
									<DropdownMenuItem onClick={() => { }}>Z</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
							<Button className='bg-red-300 text-foreground hover:bg-red-400  hover:text-accent-foreground' onClick={null}>
								Delete Element
							</Button>
							<Button className='bg-red-400 text-foreground hover:bg-red-500 hover:text-accent-foreground' onClick={() => {
								setArcs([]);
							}}>
								Delete Arcs
							</Button>
							<Button className='bg-red-400 text-foreground hover:bg-red-500 hover:text-accent-foreground' onClick={() => {
								setPlaces([]);
								setArcs([]);
								setTransitions([]);
							}}>
								Delete All
							</Button>
						</ButtonGroup>
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
						if (movingPlaceId) {
							console.log("Moving place:", movingPlaceId);
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
							setTransitions((prev) =>
								prev.map((transition) =>
									transition.id === movingPlaceId
										? {
											...transition,
											x: mousePos.x - 16,
											y: mousePos.y - 16,
										}
										: transition
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
						<defs>
							<marker
								id="arrow"
								markerWidth="10"
								markerHeight="10"
								refX="20"
								refY="5"
								orient="auto"
								markerUnits="strokeWidth"
							>
								<path d="M 0 0 L 10 5 L 0 10 z" fill="black" />
							</marker>
						</defs>
						{arcs.map((arc) => {
							const fromPlace = places.find(p => p.id === arc.from) || transitions.find(t => t.id === arc.from);
							const toPlace = places.find(p => p.id === arc.to) || transitions.find(t => t.id === arc.to);
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
								markerEnd="url(#arrow)"
							/>);
						})}
						{creatingArc && arcStartId && (
							(() => {
								const fromPlace = places.find(p => p.id === arcStartId) || transitions.find(t => t.id === arcStartId);
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
								pointerEvents="all"
								onClick={() => {

									if (!creatingArc) {
										setSelectedElement(selectedElement === transition.id ? null : transition.id);
										return;
									}

									// Arc creation logic
									if (!arcStartId) {
										setArcStartId(transition.id);
										setArcStartType("transition");
									} else if (arcStartType === "place") {
										setArcs((prev) => [
											...prev,
											{
												id: Date.now(),
												from: arcStartId,
												to: transition.id,
												value: 1,
											},
										]);
										setCreatingArc(false);
										setArcStartId(null);
										setArcStartType(null);
										return;
									}
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

					{(placingPlace || movingPlaceId && !selectedTransition) ? (
						<div
							className='absolute w-8 h-8 rounded-full border-2 border-dashed border-black bg-white opacity-70 pointer-events-none'
							style={{
								left: mousePos.x - 16,
								top: mousePos.y - 16,
							}}
						/>
					) : movingPlaceId && selectedTransition && (
						<div
							className='absolute w-5 h-15 rounded border-2 border-dashed border-black bg-white opacity-70 pointer-events-none'
							style={{
								left: mousePos.x - 10,
								top: mousePos.y - 30,
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
									if (!creatingArc) {
										setSelectedElement(selectedElement === place.id ? null : place.id);
										return;
									}

									// Arc creation logic
									if (!arcStartId) {
										setArcStartId(place.id);
										setArcStartType("place");
									} else if (arcStartType === "transition") {
										setArcs((prev) => [
											...prev,
											{
												id: Date.now(),
												from: arcStartId,
												to: place.id,
											},
										]);

										setCreatingArc(false);
										setArcStartId(null);
										setArcStartType(null);
										return;
									}
								}}
							><p className="text-white pointer-events-none">{place.value}</p></div>
						</div>
					))}
					{
						selectedTransition && (
							<Button
								variant="outline"
								size="icon"
								className="absolute"
								style={{
									left: selectedTransition.x - 10,
									top: selectedTransition.y - 50,
								}}
								onClick={() => {
									setMovingPlaceId(
										movingPlaceId === selectedTransition.id ? null : selectedTransition.id
									);
								}}
							>
								{
									movingPlaceId === selectedTransition.id ? <HandGrab /> : <Hand />
								}
							</Button>
						)
					}
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
					{arcs.map((arc) => {
						const fromPlace = places.find(p => p.id === arc.from) || transitions.find(t => t.id === arc.from);
						const toPlace = places.find(p => p.id === arc.to) || transitions.find(t => t.id === arc.to);
						if (!fromPlace || !toPlace) return null;

						return (<p
							key={arc.id + "-value"}
							className="absolute"
							style={{
								left: (fromPlace.x + toPlace.x) / 2 + 15,
								top: (fromPlace.y + toPlace.y) / 2 + 20,
							}
							}
						>{arc.value}</p>);
					})}
				</div>
			</div>
		</>
	);
}

export default App;
