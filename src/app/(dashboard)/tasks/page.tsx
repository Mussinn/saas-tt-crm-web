'use client';
import Link from 'next/link';
import {useSelector} from 'react-redux';
import {RootState} from '@/src/lib/store';
import {useState} from 'react';
import {useDroppable} from '@dnd-kit/core';
import {
    DndContext,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import type { KanbanColumn, WorkBoardTask } from '@/src/types/task.types';
import {useTranslations} from 'next-intl';
import {useAppFormatters} from '@/src/i18n/provider';

// --- 1. КОНСТАНТЫ ---

const COLUMNS: KanbanColumn[] = [
    {id: 'TODO', title: 'TODO', color: 'border-t-slate-500'},
    {id: 'MODELING', title: 'MODELING', color: 'border-t-blue-500'},
    {id: 'MILLING', title: 'MILLING', color: 'border-t-purple-500'},
    {id: 'POST_PROCESSING', title: 'POST_PROCESSING', color: 'border-t-orange-500'},
    {id: 'DONE', title: 'DONE', color: 'border-t-green-500'},
];

const materialColors: { [key: string]: string } = {
    'Zirconia': 'bg-slate-100 text-slate-700 border-slate-200',
    'E-max': 'bg-sky-100 text-sky-800 border-sky-200',
    'PMMA': 'bg-pink-100 text-pink-800 border-pink-200',
    'Titanium': 'bg-zinc-200 text-zinc-900 border-zinc-300',
};

const initialTasks: WorkBoardTask[] = [
    {
        id: 'TT-101',
        patient: 'Алиев К.',
        type: 'CROWN',
        material: 'Zirconia',
        units: 1,
        priority: 'high',
        deadline: '2026-04-10',
        status: 'TODO',
        techId: '1'
    },
    {
        id: 'TT-102',
        patient: 'Иванова М.',
        type: 'VENEER',
        material: 'E-max',
        units: 6,
        priority: 'urgent',
        deadline: '2026-04-08',
        status: 'MODELING',
        techId: '2'
    },
    {
        id: 'TT-103',
        patient: 'Смирнов Д.',
        type: 'DENTURE',
        material: 'PMMA',
        units: 14,
        priority: 'medium',
        deadline: '2026-04-15',
        status: 'MILLING',
        techId: '1'
    },
    {
        id: 'TT-104',
        patient: 'Петров А.',
        type: 'INLAY',
        material: 'Zirconia',
        units: 2,
        priority: 'low',
        deadline: '2026-04-12',
        status: 'TODO',
        techId: '3'
    },
    {
        id: 'TT-105',
        patient: 'Нурахметов Б.',
        type: 'BRIDGE',
        material: 'Zirconia',
        units: 3,
        priority: 'high',
        deadline: '2026-04-09',
        status: 'DONE',
        techId: '1'
    },
];

// --- 2. КОМПОНЕНТ КАРТОЧКИ (TaskCard) ---

const TaskCard = ({task, role}: { task: WorkBoardTask, role: string | null }) => {
    const t = useTranslations('orders.board');
    const format = useAppFormatters();
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: task.id,
        data: {type: 'Task', task}
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const isOverdue = new Date(task.deadline) < new Date('2026-04-09');
    const isToday = task.deadline === '2026-04-09';

    return (
        <Link href={`/orders/${task.id}`}>
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-blue-400 cursor-grab active:cursor-grabbing transition flex flex-col gap-3"
            >
                <div className="flex justify-between items-center text-[11px]">
                <span
                    className="font-bold text-blue-700 uppercase tracking-tight bg-blue-50 px-1.5 py-0.5 rounded">{task.id}</span>
                    {role === 'DISPATCHER' && (
                        <div className="flex items-center gap-1 text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            <div
                                className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-[8px] text-white font-bold">T{task.techId}</div>
                            <span>{t('technician', {id: task.techId})}</span>
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-slate-900 font-semibold text-sm leading-tight">{t(`workTypes.${task.type as 'CROWN' | 'VENEER' | 'DENTURE' | 'INLAY' | 'BRIDGE'}`)} ({task.units})</h3>
                    <p className="text-xs text-slate-600 mt-1">{t('patient', {name: task.patient})}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded border ${materialColors[task.material] || 'bg-slate-100'}`}>{task.material}</span>
                </div>
                <div className="flex items-end justify-between border-t border-slate-100 pt-3 mt-1">
                    <div
                        className="w-7 h-7 rounded-full bg-slate-600 border-2 border-white text-white flex items-center justify-center font-bold text-xs shadow-inner">{task.patient[0]}</div>
                    <div
                        className={`text-right text-xs p-1.5 rounded ${isOverdue ? 'bg-red-100 text-red-800' : isToday ? 'bg-orange-100 text-orange-800' : 'text-slate-500'}`}>
                        <p className="text-[10px] uppercase tracking-wider leading-none">{t('deadline')}</p>
                        <p className="mt-0.5 leading-none">{format.date(task.deadline, {
                            day: 'numeric',
                            month: 'short'
                        })}</p>
                    </div>
                </div>
            </div>
        </Link>
    );
};

// --- 3. ОСНОВНАЯ СТРАНИЦА ---

type DroppableColumnProps = {
    id: KanbanColumn['id'];
    children: React.ReactNode;
    column: KanbanColumn;
};

const DroppableColumn = ({id, children, column}: DroppableColumnProps) => {
    const {setNodeRef} = useDroppable({
        id: id, // ID колонки (TODO, MODELING и т.д.)
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex max-h-full w-[18rem] shrink-0 flex-col rounded-xl border border-slate-200 border-t-4 bg-slate-100 shadow-inner sm:w-80 ${column.color}`}
        >
            {children}
        </div>
    );
};

export default function BoardPage() {
    const t = useTranslations('orders.board');
    const tStages = useTranslations('analytics.stages.codes');
    const getStageLabel = (stage: KanbanColumn['id']) => {
        switch (stage) {
            case 'TODO': return tStages('TODO');
            case 'MODELING': return tStages('MODELING');
            case 'MILLING': return tStages('MILLING');
            case 'POST_PROCESSING': return tStages('POST_PROCESSING');
            case 'DONE': return tStages('DONE');
        }
    };
    const {id: userId, role} = useSelector((state: RootState) => state.auth);
    const [tasks, setTasks] = useState(initialTasks);

    // Внутри BoardPage
    const [activeId, setActiveId] = useState<string | null>(null);

    // Находим объект задачи по ID, чтобы отрисовать её в оверлее
    const activeTask = tasks.find(t => t.id === activeId);

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 8}})
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id)); // Запоминаем ID, когда начали тянуть
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        if (activeId === overId) return;

        setTasks((prev) => {
            const activeIndex = prev.findIndex((t) => t.id === activeId);
            const overIndex = prev.findIndex((t) => t.id === overId);

            // Если перетащили на другую карточку
            if (overIndex !== -1) {
                const newStatus = prev[overIndex].status;
                const updated = [...prev];
                updated[activeIndex] = {...updated[activeIndex], status: newStatus};
                return arrayMove(updated, activeIndex, overIndex);
            }

            // Если перетащили на пустую колонку (overId будет равен ID колонки)
            const targetColumn = COLUMNS.find(col => col.id === overId);
            if (targetColumn) {
                const updated = [...prev];
                updated[activeIndex] = {...updated[activeIndex], status: targetColumn.id};
                return updated;
            }

            return prev;
        });
    };


    const filteredTasks = role === 'DISPATCHER' ? tasks : tasks.filter(t => t.techId === userId);

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
        >
            <div className="flex min-h-[calc(100dvh-8rem)] flex-col space-y-5">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
                        <p className="text-slate-500 text-sm">{role === 'DISPATCHER' ? t('monitoring') : t('myTasks')}</p>
                    </div>
                </header>

                <div className="flex flex-1 items-start gap-4 overflow-x-auto pb-4">
                    {COLUMNS.map((column) => {
                        const tasksInColumn = filteredTasks.filter((t) => t.status === column.id);

                        return (
                            <DroppableColumn key={column.id} id={column.id} column={column}>
                                {/* Заголовок колонки */}
                                <div
                                    className="p-4 flex justify-between items-center border-b border-slate-200 bg-white/50 rounded-t-xl">
                                    <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wider">{getStageLabel(column.id)}</h2>
                                    <span
                                        className="bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {tasksInColumn.length}
                </span>
                                </div>

                                {/* Список карточек */}
                                <SortableContext id={column.id} items={tasksInColumn.map(t => t.id)}
                                                 strategy={verticalListSortingStrategy}>
                                    <div
                                        className="p-3 space-y-4 overflow-y-auto flex-1 min-h-[200px]"> {/* Важно: добавь min-h */}
                                        {tasksInColumn.map((task) => (
                                            <TaskCard key={task.id} task={task} role={role}/>
                                        ))}
                                        {tasksInColumn.length === 0 && (
                                            <div className="text-center py-8 text-slate-400 text-xs italic">{t('empty')}</div>
                                        )}
                                    </div>
                                </SortableContext>
                            </DroppableColumn>
                        );
                    })}
                </div>
            </div>
            <DragOverlay dropAnimation={null}>
                {activeTask ? (
                    <div className="rotate-3 opacity-90 cursor-grabbing">
                        <TaskCard task={activeTask} role={role}/>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
