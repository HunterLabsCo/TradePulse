import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, GripVertical } from 'lucide-react'

function SortableImage({ item, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : 'auto' }}
      className="group relative aspect-square overflow-hidden rounded-lg border border-border-subtle bg-elevated"
    >
      <img src={item.previewURL} alt={`Frame ${index + 1}`} className="h-full w-full object-cover" draggable={false} />
      <div className="absolute top-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">{index + 1}</div>
      <div {...attributes} {...listeners} className="absolute top-1 right-6 cursor-grab rounded bg-black/70 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
        <GripVertical size={12} />
      </div>
      <button onClick={() => onRemove(item.id)} className="absolute top-1 right-1 rounded bg-black/70 p-0.5 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100">
        <X size={12} />
      </button>
    </div>
  )
}

export default function ImageSorter({ images, onChange }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id)
      const newIndex = images.findIndex((img) => img.id === over.id)
      onChange(arrayMove(images, oldIndex, newIndex))
    }
  }

  const handleRemove = (id) => {
    const removed = images.find((img) => img.id === id)
    if (removed) URL.revokeObjectURL(removed.previewURL)
    onChange(images.filter((img) => img.id !== id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((item, index) => (
            <SortableImage key={item.id} item={item} index={index} onRemove={handleRemove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
