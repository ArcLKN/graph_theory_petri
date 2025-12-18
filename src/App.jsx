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
	isInvariantTransitions,
	isInvariantConservation,
	tarjan,
	puits,
	sources,
	estSimple,
	DFS,
	isLive,
} from "../petriLogic.js";
import { reseau, etatDepart, valDepart } from "../varGlobales.js";
import EditorToolbar from "./components/EditorToolbar.jsx";
import ArrowMarker from "./components/ArrowMarker.jsx";
import { ChangeTextDialogBox } from "./components/changeText.jsx";

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

function addAnnotation(setAnnotations, mousePos) {
	setAnnotations((prevAnnotations) => [
		...prevAnnotations,
		{
			id: Date.now(),
			x: mousePos.x,
			y: mousePos.y,
			text: "New annotation",
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
	const [selectedAnnotation, setSelectedAnnotation] = useState(null);
	const [pendingAnnotation, setPendingAnnotation] = useState(null);
	const [annotations, setAnnotations] = useState([]);
	const [movingAnnotationId, setMovingAnnotationId] = useState(null);
	const [isTextBoxOpen, setIsTextBoxOpen] = useState(false);

	const [arcs, setArcs] = useState([]);
	const [creatingArc, setCreatingArc] = useState(false);
	const [arcStartId, setArcStartId] = useState(null);
	const [arcStartType, setArcStartType] = useState(null);
	const [editingArcEnd, setEditingArcEnd] = useState(null);

	const [placingTransition, setPlacingTransition] = useState(false);
	const [transitions, setTransitions] = useState([]);
	const [reseauP, setReseauP] = useState(reseau);

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

	const addAnnotation = () => {
		const newAnnotation = {
			id: Date.now(),
			x: mousePos.x - 20,
			y: mousePos.y - 20,
			text: "New annotation",
		};

		setAnnotations((prev) => [...prev, newAnnotation]);
		setSelectedAnnotation(newAnnotation);
		setIsTextBoxOpen(true);
	};

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
		setPlaces([]); // Supprime tous les places
		setTransitions([]); // Supprime toutes les transitions
		setArcs([]); // Supprime tous les arcs
		setAnnotations([]); // Supprime toutes les annotations
		setPendingAnnotation(null); // Réinitialise le texte en cours de placement
		setSelectedElement(null); // Désélectionne tout
		setSelectedAnnotation(null); // Désélectionne une annotation
		setPlacingPlace(false);
		setPlacingTransition(false);
		setPlacingAnnotation(false);
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
		} else if (placingAnnotation && pendingAnnotation) {
			setAnnotations((prev) => [
				...prev,
				{
					...pendingAnnotation,
					x: mousePos.x,
					y: mousePos.y,
				},
			]);

			setPendingAnnotation(null);
			setPlacingAnnotation(false);
			return;
		} else if (movingAnnotationId) {
			setMovingAnnotationId(null);
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
	//vérifie que le réseau est valide
	const handleVerif = () => {
		//supprimer les potentielles erreurs précédentes
		setResult("");
		const reseauLocal = transformationIn(places, transitions, arcs);

		const marquage = marquageValide(reseauLocal);
		if (!marquage) {
			setResult(
				"erreur: Le réseau de pétri n'est pas valide (nombre décimal et négatif)"
			);
			return false;
		}

		const bipartite = isBipartite(reseauLocal);
		if (!bipartite) {
			setResult("erreur: Le réseau n'est pas Bipartite");
			return false;
		}

		const connex = isConnex(reseauLocal);
		if (!connex) {
			setResult("erreur: le graph n'est pas connex");
			return false;
		}

		return true;
	};

	// fonction pour envoyer les places,transitions,arcs au canvaToDic.js
	const handleTransformationIn = () => {
		if (handleVerif()) {
			const res = transformationIn(places, transitions, arcs);
			setReseauP(res);
			const formatted = formatReseau(res);
			console.log(formatted);
			setResult(formatted);
		}
	};

	// Fonction pour lancer la simulation après transformation et vérification
	const handleSimulation = () => {
		if (handleVerif()) {
			//Construire le réseau à partir du canvas
			const reseauLocal = transformationIn(places, transitions, arcs);

			// Simuler
			const reseauSimule = simulation(structuredClone(reseauLocal));

			// Mettre à jour le state réseau
			setReseauP(reseauSimule);

			// Mettre à jour l'UI
			const { places: newPlaces, arcs: newArcs } = transformationOut(
				places,
				transitions,
				arcs,
				reseauSimule
			);

			setPlaces(newPlaces);
			setArcs(newArcs);
		}
	};
	/////////////////////////////

	const handleBorne = () => {
		const borne = isBorne();
		if (!borne) {
			setResult("Dépassement de borne");
		} else setResult("On est bien k-borné");
		return;
	};

	const handleDeadlock = () => {
		if (handleVerif()) {
			const reseauLocal = transformationIn(places, transitions, arcs);
			const deadlock = isDeadlock(reseauLocal);
			if (!deadlock) {
				setResult("pas de deadlock");
			} else {
				setResult("deadlock situation");
			}
		}
		return;
	};

	const handleTarjan = () => {
		if (handleVerif()) {
			const reseauLocal = transformationIn(places, transitions, arcs);
			const sccs = tarjan(reseauLocal);
			setResult(
				`Composantes fortement connexes: ${
					sccs.length
				} trouvées - ${JSON.stringify(sccs)}`
			);
		}
		return;
	};

	const handleInvariantTransitions = () => {
		if (handleVerif()) {
			const reseauLocal = transformationIn(places, transitions, arcs);
			const hasInvariant = isInvariantTransitions(reseauLocal);
			if (hasInvariant) {
				setResult(
					"T-invariant détecté: le réseau peut revenir au marquage initial"
				);
			} else {
				setResult("Aucun T-invariant détecté");
			}
		}
		return;
	};

	const handleInvariantConservation = () => {
		if (handleVerif()) {
			const reseauLocal = transformationIn(places, transitions, arcs);
			const isConserved = isInvariantConservation(reseauLocal);
			if (isConserved) {
				setResult("P-invariant respecté: conservation des jetons");
			} else {
				setResult("P-invariant non respecté: jetons créés ou détruits");
			}
		}
		return;
	};

	const handleMarquageValide = () => {
		if (handleVerif()) {
			const reseauLocal = transformationIn(places, transitions, arcs);
			const isValid = marquageValide(reseauLocal);
			if (isValid) {
				setResult("Marquage valide");
			} else {
				setResult(
					"Marquage invalide: valeurs négatives ou non entières"
				);
			}
		}
		return;
	};

	const handlePuits = () => {
		if (handleVerif()) {
			const reseauLocal = transformationIn(places, transitions, arcs);
			const puitsNodes = puits(reseauLocal);
			setResult(`Puits trouvés: ${puitsNodes.join(", ") || "aucun"}`);
		}
		return;
	};

	const handleSources = () => {
		if (handleVerif()) {
			const reseauLocal = transformationIn(places, transitions, arcs);
			const sourceNodes = sources(reseauLocal);
			setResult(
				`Sources trouvées: ${sourceNodes.join(", ") || "aucune"}`
			);
		}
		return;
	};

	const handleEstSimple = () => {
		if (handleVerif()) {
			const reseauLocal = transformationIn(places, transitions, arcs);
			const simple = estSimple(reseauLocal);
			if (simple) {
				setResult(
					"Réseau simple: pas d'arcs multiples entre mêmes nœuds"
				);
			} else {
				setResult("Réseau non simple: arcs multiples détectés");
			}
		}
		return;
	};

	/////////////////////////////

	return (
		<div className='w-screen h-screen App px-16 py-4 space-y-4 bg-white'>
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

			{isTextBoxOpen && (
				<ChangeTextDialogBox
					setDialogBoxIsOpen={setIsTextBoxOpen}
					previousText={selectedAnnotation?.text ?? ""}
					onSave={(text) => {
						if (!selectedAnnotation) {
							if (!selectedAnnotation) {
								const newAnn = {
									id: Date.now(),
									text,
								};
								setPendingAnnotation(newAnn);
								setPlacingAnnotation(true); // active le mode placement
								setSelectedAnnotation(newAnn); // pour que le texte fantôme soit aussi sélectionné
							}
						} else {
							setAnnotations((prev) =>
								prev.map((ann) =>
									ann.id === selectedAnnotation.id
										? { ...ann, text }
										: ann
								)
							);
						}

						setIsTextBoxOpen(false);
					}}
				/>
			)}

			{/* Header */}
			<h1 className='text-xl font-bold'>Pétri Network Maker</h1>

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
				addAnnotation={addAnnotation}
				setIsOrientedGraph={setIsOriented}
				isOrientedGraph={isOriented}
				placingPlace={placingPlace}
				handleBorne={handleBorne}
				handleDeadlock={handleDeadlock}
				handleTarjan={handleTarjan}
				handleInvariantTransitions={handleInvariantTransitions}
				handleInvariantConservation={handleInvariantConservation}
				handleMarquageValide={handleMarquageValide}
				handlePuits={handlePuits}
				handleSources={handleSources}
				handleEstSimple={handleEstSimple}
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
					{annotations.map((ann) => (
						<text
							key={ann.id}
							x={ann.x}
							y={ann.y}
							fontSize={16}
							style={{ cursor: "pointer", userSelect: "none" }}
							pointerEvents='all'
							onMouseDown={(e) => {
								e.stopPropagation();
								setSelectedAnnotation(ann);

								const svg = e.currentTarget.ownerSVGElement;
								const rect = svg.getBoundingClientRect();
								const offsetX = e.clientX - rect.left - ann.x;
								const offsetY = e.clientY - rect.top - ann.y;

								const handleDrag = (ev) => {
									const newX =
										ev.clientX - rect.left - offsetX;
									const newY =
										ev.clientY - rect.top - offsetY;
									setAnnotations((prev) =>
										prev.map((a) =>
											a.id === ann.id
												? { ...a, x: newX, y: newY }
												: a
										)
									);
								};

								const handleDragEnd = () => {
									window.removeEventListener(
										"mousemove",
										handleDrag
									);
									window.removeEventListener(
										"mouseup",
										handleDragEnd
									);
								};

								window.addEventListener(
									"mousemove",
									handleDrag
								);
								window.addEventListener(
									"mouseup",
									handleDragEnd
								);
							}}
							onClick={(e) => {
								e.stopPropagation();
								setSelectedAnnotation(ann);
								setIsTextBoxOpen(true);
							}}
						>
							{ann.text}
						</text>
					))}

					{/* Texte fantôme lors du placement */}
					{placingAnnotation && pendingAnnotation && (
						<text
							x={mousePos.x}
							y={mousePos.y}
							fontSize={16}
							fill='rgba(0,0,0,0.3)'
							pointerEvents='none'
						>
							{pendingAnnotation.text}
						</text>
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
					<ButtonGroup
						className='absolute'
						style={{
							left: selectedTransition.x - 10,
							top: selectedTransition.y - 50,
						}}
					>
						<Button
							variant='outline'
							size='icon'
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
						<Button
							variant='outline'
							className='bg-red-300 hover:bg-red-300'
							size='icon'
							onClick={() => {
								// Delete arc
								setTransitions((prev) =>
									prev.filter(
										(a) => a.id !== selectedTransition.id
									)
								);
								setSelectedElement(null);
							}}
						>
							<Eraser />
						</Button>
					</ButtonGroup>
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
								<ButtonGroup
									className='absolute'
									style={{
										left: (fromPlace.x + toPlace.x) / 2,
										top: (fromPlace.y + toPlace.y) / 2 + 40,
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
										className='bg-red-300 hover:bg-red-300'
										size='icon'
										onClick={() => {
											// Delete arc
											setArcs((prev) =>
												prev.filter(
													(a) => a.id !== arc.id
												)
											);
											setSelectedElement(null);
										}}
									>
										<Eraser />
									</Button>
								</ButtonGroup>
							)}
						</div>
					);
				})}
			</div>

			{/* Result area */}
			<Textarea
				placeholder='Results will be here.'
				value={result}
				className='bg-white w-full h-24 text-black'
			/>
		</div>
	);
}

export default App;
