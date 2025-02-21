import { Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHistoryStore } from "@/lib/historyManager";
import { useHotkeys } from "react-hotkeys-hook";
import { useToast } from "@/hooks/use-toast";

export function TaskToolbar() {
  const { undo, redo, canUndo, canRedo, getLastAction } = useHistoryStore();
  const { toast } = useToast();

  const handleUndo = () => {
    if (!canUndo()) return;
    
    const action = getLastAction();
    undo();
    
    toast({
      title: "Action undone",
      description: action,
      variant: action.startsWith("Delete") ? "success" : "default",
    });
  };

  // Setup keyboard shortcuts
  useHotkeys("mod+z", (e) => {
    e.preventDefault();
    handleUndo();
  });

  useHotkeys("mod+shift+z", (e) => {
    e.preventDefault();
    if (canRedo()) {
      redo();
      toast({
        title: "Action redone",
        description: `Redid: ${getLastAction()}`,
      });
    }
  });

  return (
    <div className="flex items-center gap-2 mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handleUndo}
        disabled={!canUndo()}
      >
        <Undo2 className="h-4 w-4 mr-2" />
        Undo
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          redo();
          toast({
            title: "Action redone",
            description: `Redid: ${getLastAction()}`,
          });
        }}
        disabled={!canRedo()}
      >
        <Redo2 className="h-4 w-4 mr-2" />
        Redo
      </Button>
      <div className="text-sm text-muted-foreground ml-2">
        {canUndo() && `Last action: ${getLastAction()}`}
      </div>
    </div>
  );
} 