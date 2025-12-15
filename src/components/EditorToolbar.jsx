import { Button } from "@/components/ui/button";
import {
	ButtonGroup,
	ButtonGroupSeparator,
	ButtonGroupText,
} from "@/components/ui/button-group";
import SimulationMenu from "./SimulationMenu.jsx";
import AnnotationMenu from "./AnnotationMenu.jsx";

export default function EditorToolbar({
	actionButtonClass,
	handleAddPlace,
	handleAddTransition,
	handleAddArc,
	handleSimulation,
	doSimulation,
	setResult,
	handleTransformationIn,
	handleDeleteArcs,
	handleDeleteAll,
	addAnnotation,
}) {
	return (
		<div className='Menu w-full'>
			<div className='flex flex-row items-start space-x-4'>
				<ButtonGroup className='flex flex-wrap gap-2'>
					{/* Action Buttons */}
					<Button
						className={actionButtonClass}
						onClick={handleAddPlace}
					>
						Add Place
					</Button>
					<Button
						className={actionButtonClass}
						onClick={handleAddTransition}
					>
						Add Transition
					</Button>
					<Button
						className={actionButtonClass}
						onClick={handleAddArc}
					>
						Add Arc
					</Button>
					<AnnotationMenu addAnnotation={addAnnotation}  />
					

					<ButtonGroupSeparator />

					{/* Simulation Buttons */}
					<Button
						className='bg-blue-300 text-foreground hover:bg-blue-400  hover:text-accent-foreground'
						onClick={handleSimulation}
					>
						{doSimulation ? "Stop Simulation" : "Start Simulation"}
					</Button>

					<SimulationMenu
						setResult={setResult}
						handleTransformationIn={handleTransformationIn}
					/>

					<ButtonGroupSeparator />

					{/* Delete Buttons */}

					<Button
						className='bg-red-300 text-foreground hover:bg-red-400  hover:text-accent-foreground'
						onClick={null}
					>
						Delete Element
					</Button>
					<Button
						className='bg-red-400 text-foreground hover:bg-red-500 hover:text-accent-foreground'
						onClick={handleDeleteArcs}
					>
						Delete Arcs
					</Button>
					<Button
						className='bg-red-400 text-foreground hover:bg-red-500 hover:text-accent-foreground'
						onClick={handleDeleteAll}
					>
						Delete All
					</Button>
				</ButtonGroup>
			</div>
		</div>
	);
}
