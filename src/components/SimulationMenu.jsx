import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function SimulationMenu({ 
	setResult, 
	handleTransformationIn, 
	handleDeadlock, 
	handleBorne,
	handleTarjan,
	handleInvariantTransitions,
	handleInvariantConservation,
	handleMarquageValide,
	handlePuits,
	handleSources,
	handleEstSimple }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant='outline'
					className='bg-blue-300 text-foreground hover:bg-blue-400  hover:text-accent-foreground'
				>
					More
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuLabel>Simulation</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => {
						setResult("Good");
					}}
				>
					X
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => {
						setResult("");
					}}
				>
					Y
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleTransformationIn}>
					Dictionnaire du réseau
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleDeadlock}>
					Vérifier Deadlock situation
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleBorne}>
					Vérification dépassement borne
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuLabel>Analyse structurelle</DropdownMenuLabel>
				<DropdownMenuItem onClick={handleTarjan}>
					Composantes fortement connexes
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handlePuits}>
					Trouver puits
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleSources}>
					Trouver sources
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleEstSimple}>
					Vérifier réseau simple
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuLabel>Analyse comportementale</DropdownMenuLabel>
				<DropdownMenuItem onClick={handleInvariantTransitions}>
					T-invariants
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleInvariantConservation}>
					P-invariants (conservation)
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleMarquageValide}>
					Valider marquage
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	
	);
}
