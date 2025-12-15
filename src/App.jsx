import { useState } from "react";
import { ChangeValueDialogBox } from "./components/changeValue";
import { Button } from "./components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Textarea } from "@/components/ui/textarea";
import { Hand, HandGrab, Eraser, Settings } from "lucide-react";
import {
	transformationIn,
	formatReseau,
	transformationOut,
} from "../canvaToDic.js";
import {
	isBipartite,
	marquageValide,
	isConnex,
	marquageInitial,
	calculNouveauMarquage,
	isFranchissable,
	echangeRessources,
	isDeadlock,
	isBorne,
	simulation,
} from "../petriLogic.js";
import { reseau, etatDepart, valDepart } from "../varGlobales.js";
import EditorToolbar from "./components/EditorToolbar.jsx";
import ArrowMarker from "./components/ArrowMarker.jsx";

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
			x: mousePos.x - 20,
			y: mousePos.y - 30,
			width: 20,
			height: 60,
		},
	]);
}

function addAnnotation() {
	// Logic to add an annotation to the Pétri Network
	setTransitions((prevTransitions) => [
		...prevTransitions,
		{
			id: Date.now(),
			x: mousePos.x - 20,
			y: mousePos.y - 30,
			width: 20,
			height: 60,
		},
	]);
}

function App() {
	const [isOriented, setIsOriented] = useState(true);

	const [isDialogBoxOpen, setDialogBoxIsOpen] = useState(false);
	const [inputValue, setInputValue] = useState(1);
	const [doSimulation, setDoSimulation] = useState(false);

	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

	const [selectedElement, setSelectedElement] = useState(null);

	const [placingPlace, setPlacingPlace] = useState(false);
	const [places, setPlaces] = useState([]);
	const [movingPlaceId, setMovingPlaceId] = useState(null);

	const [placingAnnotation, setPlacingAnnotation] = useState(false);
	const [annotations, setAnnotations] = useState([]);
	const [movingAnnotationId, setMovingAnnotationId] = useState(null);

	const [arcs, setArcs] = useState([]);
	const [creatingArc, setCreatingArc] = useState(false);
	const [arcStartId, setArcStartId] = useState(null);
	const [arcStartType, setArcStartType] = useState(null);
	const [editingArcEnd, setEditingArcEnd] = useState(null);

	const [placingTransition, setPlacingTransition] = useState(false);
	const [transitions, setTransitions] = useState([]);

	const selectedPlace =
		places.find((place) => place.id === selectedElement) || null;
	const selectedArc = arcs.find((a) => a.id === selectedElement) || null;
	const selectedTransition = transitions.find(
		(t) => t.id === selectedElement
	);
	const selectedItem = selectedPlace ?? selectedArc;
	const setItems = selectedPlace ? setPlaces : setArcs;

	const findNodeById = (id) =>
		places.find((p) => p.id === id) || transitions.find((t) => t.id === id);

	const [result, setResult] = useState("");

	const actionButtonClass =
		"bg-background text-foreground hover:bg-accent hover:text-accent-foreground";

	const handleAddPlace = () => {
		setPlacingPlace(!placingPlace);
	};

	const handleAddTransition = () => {
		setPlacingTransition(!placingTransition);
	};

	const handleAddArc = () => {
		setCreatingArc(!creatingArc);
		setArcStartId(null);
	};

	const handleDeleteAll = () => {
		setPlaces([]);
		setArcs([]);
		setTransitions([]);
	};

	const handleDeleteArcs = () => {
		setArcs([]);
	};

	const handleClickCanvas = () => {
		// Logic for clicking on the canvas
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
	};

	const handleClickPlace = (placeId) => {
		// Logic for clicking on a place
		console.log("Place clicked:", placeId);
	};

	const handleTransitionClick = (transitionId) => {
		// Logic for clicking on a transition
		if (!creatingArc) {
			setSelectedElement(
				selectedElement === transitionId ? null : transitionId
			);
			return;
		}

		// Arc creation logic
		if (!arcStartId) {
			setArcStartId(transitionId);
			setArcStartType("transition");
		} else if (arcStartType === "place") {
			setArcs((prev) => [
				...prev,
				{
					id: Date.now(),
					from: arcStartId,
					to: transitionId,
					value: 1,
				},
			]);
			setCreatingArc(false);
			setArcStartId(null);
			setArcStartType(null);
			return;
		}
	};

	const handleMouseMove = (e) => {
		setMousePos({
			x: e.clientX,
			y: e.clientY,
		});
	};

	/////////// Gabriel ///////////
	// fonction pour envoyer les places,transitions,arcs au canvaToDic.js
	const handleTransformationIn = () => {
		const res = transformationIn(places, transitions, arcs);
		const formatted = formatReseau(res);
		console.log(formatted);
		setResult(formatted);
	};

	// Fonction pour lancer la simulation après transformation et vérification
	const handleSimulation = () => {
		// transformation en dictionnaire
		handleTransformationIn();

		// vérification bipartite
		const marquage = marquageValide();
		if (!marquage) {
			setResult(
				"erreur: Le réseau n'est pas valide ! (transition < 0 ou jeton d'un état n'est pas un nombre)"
			);
			return;
		}

		const bipartite = isBipartite();
		if (!bipartite) {
			setResult(
				"erreur: Deux Transitions ou deux Etats connectés ensemble !"
			);
			return;
		}

		const connex = isConnex();
		if (!connex) {
			setResult("erreur: Le réseau n'est pas connex !");
			return;
		}

		// lancer la simulation pour toutes les transitions
		Object.keys(reseau).forEach((node) => {
			if (node.startsWith("T")) {
				simulation(node);
			}
		});

		transformationOut(places, transitions, arcs);
	};
	/////////////////////////////

	return (
		<div className='w-screen h-screen App px-16 py-4 space-y-4'>
			{isDialogBoxOpen && selectedItem && (
				<ChangeValueDialogBox
					setDialogBoxIsOpen={setDialogBoxIsOpen}
					previousValue={(selectedPlace ?? selectedArc).value ?? 1}
					onSave={(value) => {
						setItems((prev) =>
							prev.map((item) =>
								item.id === selectedElement
									? { ...item, value }
									: item
							)
						);
					}}
				/>
			)}
			<div>
				<h1 className='text-xl font-bold'>Pétri Network Maker</h1>
			</div>

			<EditorToolbar
				doSimulation={doSimulation}
				handleAddPlace={handleAddPlace}
				handleAddTransition={handleAddTransition}
				handleAddArc={handleAddArc}
				handleSimulation={handleSimulation}
				handleDeleteArcs={handleDeleteArcs}
				handleDeleteAll={handleDeleteAll}
				actionButtonClass={actionButtonClass}
				setResult={setResult}
				handleTransformationIn={handleTransformationIn}
				setIsOrientedGraph={setIsOriented}
				isOrientedGraph={isOriented}
				placingPlace={placingPlace}
			/>

			{/* Canvas for drawing Pétri Network will go here */}
			<div
				className='Canvas border border-gray-400 w-full h-8/12 bg-white rounded-2xl'
				onMouseMove={handleMouseMove}
				onClick={handleClickCanvas}
			>
				<svg className='absolute inset-0 w-full h-full pointer-events-none'>
					<ArrowMarker />
					{arcs.map((arc) => {
						const fromPlace = findNodeById(arc.from);
						const toPlace = findNodeById(arc.to);
						if (!fromPlace || !toPlace) return null;

						return (
							<g key={arc.id}>
								{/* Click area */}
								<line
									x1={fromPlace.x + 16}
									y1={fromPlace.y + 16}
									x2={toPlace.x + 16}
									y2={toPlace.y + 16}
									stroke='transparent'
									strokeWidth={20}
									pointerEvents='stroke'
									onClick={() => setSelectedElement(arc.id)}
								/>

								{/* Visible line */}
								<line
									x1={fromPlace.x + 16}
									y1={fromPlace.y + 16}
									x2={toPlace.x + 16}
									y2={toPlace.y + 16}
									stroke='black'
									strokeWidth={2}
									markerEnd={
										isOriented ? "url(#arrow)" : null
									}
									pointerEvents='none'
								/>
							</g>
						);
					})}
					{creatingArc &&
						arcStartId &&
						(() => {
							const fromPlace = findNodeById(arcStartId);
							if (!fromPlace) return null;
							return (
								<line
									x1={fromPlace.x + 16}
									y1={fromPlace.y + 16}
									x2={mousePos.x}
									y2={mousePos.y}
									stroke='black'
									strokeWidth='2'
								/>
							);
						})()}
					{transitions.map((transition) => (
						<rect
							key={transition.id}
							x={transition.x}
							y={transition.y}
							width={transition.width}
							height={transition.height}
							fill={
								selectedElement === transition.id
									? "blue"
									: "gray"
							}
							stroke='black'
							strokeWidth='2'
							pointerEvents='all'
							onClick={() => handleTransitionClick(transition.id)}
						/>
					))}
					{placingTransition && (
						<rect
							x={mousePos.x - 20}
							y={mousePos.y - 30}
							width={20}
							height={60}
							fill='rgba(0,0,0,0.2)' // rectangle fantôme pendant le placement
							stroke='black'
							strokeWidth='2'
							pointerEvents='none'
						/>
					)}
				</svg>

				{placingPlace || (movingPlaceId && !selectedTransition) ? (
					<div
						className='absolute w-8 h-8 rounded-full border-2 border-dashed border-black bg-white opacity-70 pointer-events-none'
						style={{
							left: mousePos.x - 16,
							top: mousePos.y - 16,
						}}
					/>
				) : (
					movingPlaceId &&
					selectedTransition && (
						<div
							className='absolute w-5 h-15 rounded border-2 border-dashed border-black bg-white opacity-70 pointer-events-none'
							style={{
								left: mousePos.x - 10,
								top: mousePos.y - 30,
							}}
						/>
					)
				)}
				{places.map((place) => (
					<div key={place.id}>
						{place.id === selectedElement && (
							<ButtonGroup
								orientation='horizontal'
								className='absolute w-fit'
								style={{
									left: place.x - 40,
									top: place.y - 50,
								}}
							>
								<Button
									variant='outline'
									size='icon'
									onClick={() => {
										setDialogBoxIsOpen(true);
									}}
								>
									<Settings />
								</Button>
								<Button
									variant='outline'
									size='icon'
									onClick={() => {
										setMovingPlaceId(
											movingPlaceId === place.id
												? null
												: place.id
										);
									}}
								>
									{movingPlaceId === place.id ? (
										<HandGrab />
									) : (
										<Hand />
									)}
								</Button>
								<Button
									variant='outline'
									className='bg-red-300 hover:bg-red-300'
									size='icon'
									onClick={() => {
										// Delete place
										setPlaces((prev) =>
											prev.filter(
												(p) => p.id !== place.id
											)
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
							className={`absolute flex items-center justify-center w-8 h-8 rounded-full hover:border-2 hover:border-blue-500 ${
								selectedElement === place.id
									? "bg-blue-500"
									: "bg-gray-500"
							}`}
							style={{ left: place.x, top: place.y }}
							onClick={() => {
								if (!creatingArc) {
									setSelectedElement(
										selectedElement === place.id
											? null
											: place.id
									);
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
											value: 1,
										},
									]);

									setCreatingArc(false);
									setArcStartId(null);
									setArcStartType(null);
									return;
								}
							}}
						>
							<p className='text-white pointer-events-none'>
								{place.value}
							</p>
						</div>
					</div>
				))}
				{selectedTransition && (
					<Button
						variant='outline'
						size='icon'
						className='absolute'
						style={{
							left: selectedTransition.x - 10,
							top: selectedTransition.y - 50,
						}}
						onClick={() => {
							setMovingPlaceId(
								movingPlaceId === selectedTransition.id
									? null
									: selectedTransition.id
							);
						}}
					>
						{movingPlaceId === selectedTransition.id ? (
							<HandGrab />
						) : (
							<Hand />
						)}
					</Button>
				)}
				{selectedArc && (
					<>
						<Button
							variant='outline'
							className='absolute text-blue-500'
							size='icon'
							style={{
								left: (
									places.find(
										(p) => p.id === selectedArc.from
									) ||
									transitions.find(
										(t) => t.id === selectedArc.from
									)
								).x,
								top: (
									places.find(
										(p) => p.id === selectedArc.from
									) ||
									transitions.find(
										(t) => t.id === selectedArc.from
									)
								).y,
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
						<Button
							variant='outline'
							className='absolute text-blue-500'
							size='icon'
							style={{
								left: (
									places.find(
										(p) => p.id === selectedArc.to
									) ||
									transitions.find(
										(t) => t.id === selectedArc.to
									)
								).x,
								top: (
									places.find(
										(p) => p.id === selectedArc.to
									) ||
									transitions.find(
										(t) => t.id === selectedArc.to
									)
								).y,
							}}
							onClick={() =>
								setEditingArcEnd({
									arcId: selectedArc.id,
									end: "to",
								})
							}
						>
							◉
						</Button>
					</>
				)}
				{arcs.map((arc) => {
					const fromPlace =
						places.find((p) => p.id === arc.from) ||
						transitions.find((t) => t.id === arc.from);
					const toPlace =
						places.find((p) => p.id === arc.to) ||
						transitions.find((t) => t.id === arc.to);
					if (!fromPlace || !toPlace) return null;

					return (
						<div key={arc.id + "-value"}>
							<p
								className='absolute'
								style={{
									left: (fromPlace.x + toPlace.x) / 2 + 15,
									top: (fromPlace.y + toPlace.y) / 2 + 20,
								}}
							>
								{arc.value}
							</p>
							{selectedElement === arc.id && (
								<Button
									variant='outline'
									size='icon'
									className='absolute'
									style={{
										left: (fromPlace.x + toPlace.x) / 2,
										top: (fromPlace.y + toPlace.y) / 2 + 40,
									}}
									onClick={() => {
										setDialogBoxIsOpen(true);
									}}
								>
									<Settings />
								</Button>
							)}
						</div>
					);
				})}
			</div>
			<Textarea
				placeholder='Results will be here.'
				disabled
				value={result}
				className='w-full h-24'
			/>
		</div>
	);
}

export default App;
