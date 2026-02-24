// designer/BlockList.tsx
// Left panel: ordered list of design blocks with drag-to-reorder.
import { useState } from "react";
import type { RsvpBlock } from "../../../../types/rsvpDesign";
import type { FormFieldConfig } from "../../../../api/hooks/useFormFieldsApi";
import { BlockPreviewCard } from "./BlockPreviewCard";
import { AddBlockMenu } from "./AddBlockMenu";

interface Props {
  blocks: RsvpBlock[];
  selectedId: string | null;
  accentColor: string;
  formFields: FormFieldConfig[];
  isFetchingQuestions: boolean;
  onSelect: (id: string) => void;
  onReorder: (sourceId: string, targetId: string) => void;
  onAdd: (type: RsvpBlock["type"]) => void;
  onUploadImages: (files: FileList) => void;
  onInsertQuestion: (questionId: string) => void;
}

export function BlockList({
  blocks,
  selectedId,
  accentColor,
  formFields,
  isFetchingQuestions,
  onSelect,
  onReorder,
  onAdd,
  onUploadImages,
  onInsertQuestion,
}: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  return (
    <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-800">Blocks</h2>
          <p className="text-xs text-gray-400">Drag to reorder · Click to edit</p>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
          {blocks.length}
        </span>
      </div>

      {/* Block list */}
      {blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
          No blocks yet. Add one below.
        </div>
      ) : (
        <div className="space-y-2">
          {blocks.map((block) => (
            <BlockPreviewCard
              key={block.id}
              block={block}
              isSelected={selectedId === block.id}
              accentColor={accentColor}
              onSelect={() => onSelect(block.id)}
              onDragStart={(e) => {
                setDraggingId(block.id);
                e.dataTransfer.setData("text/plain", block.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggingId && draggingId !== block.id) {
                  onReorder(draggingId, block.id);
                }
              }}
              onDragEnd={() => setDraggingId(null)}
            />
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <AddBlockMenu
          onAdd={onAdd}
          onUploadImages={onUploadImages}
          availableQuestions={formFields}
          isFetchingQuestions={isFetchingQuestions}
          onInsertQuestion={onInsertQuestion}
        />
      </div>
    </div>
  );
}
