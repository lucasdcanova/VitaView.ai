import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DraggableWidgetProps {
    id: string;
    children: React.ReactNode;
    className?: string;
}

export function DraggableWidget({ id, children, className }: DraggableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        touchAction: "none",
        zIndex: isDragging ? 999 : "auto",
        position: isDragging ? "relative" as const : "static" as const,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={className} data-widget-id={id}>
            {children}
        </div>
    );
}
