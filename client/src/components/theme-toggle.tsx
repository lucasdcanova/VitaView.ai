import React from 'react';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

// Theme changes are intentionally centralized in Settings > Preferences.
export function ThemeToggle() {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full hover:bg-gray-100 cursor-default"
                        disabled
                    >
                        <Settings2 className="h-4 w-4 text-gray-400" />
                        <span className="sr-only">Tema controlado em Configurações</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Altere o tema em Configurações</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
