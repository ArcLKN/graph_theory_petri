import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function SimulationMenu({ setResult, handleTransformationIn }) {
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
					Transformer le réseau
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
