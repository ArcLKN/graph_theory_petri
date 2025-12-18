import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function AnnotationMenu({ addAnnotation }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="text-foreground hover:bg-blue-400 hover:text-accent-foreground"
				>
					Add Annotation
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent>
				<DropdownMenuLabel>Type</DropdownMenuLabel>
				<DropdownMenuSeparator />

				<DropdownMenuItem
					onClick={() => 
                        addAnnotation( )
                    }
				>
					Text
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}