import { Button } from "@/components/ui/button";
import {
	ButtonGroup,
	ButtonGroupSeparator,
	ButtonGroupText,
} from "@/components/ui/button-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import SimulationMenu from "./SimulationMenu.jsx";

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
	setIsOrientedGraph,
	isOrientedGraph,
	placingPlace,
	handleDeadlock,
	handleBorne,
}) {
	return (
		<div className='Menu w-full flex flex-row items-center justify-between p-2 px-4 bg-gray-200 border-b border-gray-300 rounded-2xl'>
			<div className='flex flex-row items-start space-x-4'>
				<ButtonGroup className='flex flex-wrap gap-2'>
					{/* Action Buttons */}
					<Button
						className={
							`${placingPlace ? "bg-orange-300" : ""}` +
							actionButtonClass
						}
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
					<Button className={actionButtonClass} onClick={null}>
						Add Annotation
					</Button>

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
						handleDeadlock = {handleDeadlock}
						handleBorne={handleBorne}
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
			<div>
				<Switch
					checked={isOrientedGraph}
					onCheckedChange={() => setIsOrientedGraph(!isOrientedGraph)}
				/>
				<Label className='ml-2'>Oriented Graph</Label>
			</div>
		</div>
	);
}
