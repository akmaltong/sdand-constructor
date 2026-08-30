'use client';
import { create } from 'zustand';
const defaultControlValue = (interactive, index) => {
    const control = interactive.controls[index];
    if (!control)
        return false;
    switch (control.kind) {
        case 'toggle':
            return control.default ?? false;
        case 'slider':
            return control.default ?? control.min;
        case 'temperature':
            return control.default ?? control.min;
    }
};
export const useInteractive = create((set, get) => ({
    items: {},
    doors: {},
    doorAnimations: {},
    windows: {},
    windowAnimations: {},
    skylights: {},
    skylightAnimations: {},
    elevators: {},
    initItem: (itemId, interactive) => {
        const { controls } = interactive;
        if (controls.length === 0)
            return;
        // Don't overwrite existing state (idempotent)
        if (get().items[itemId])
            return;
        set((state) => ({
            items: {
                ...state.items,
                [itemId]: {
                    controlValues: controls.map((_, i) => defaultControlValue(interactive, i)),
                },
            },
        }));
    },
    setControlValue: (itemId, index, value) => {
        set((state) => {
            const item = state.items[itemId];
            if (!item)
                return state;
            const next = [...item.controlValues];
            next[index] = value;
            return { items: { ...state.items, [itemId]: { controlValues: next } } };
        });
    },
    removeItem: (itemId) => {
        set((state) => {
            const { [itemId]: _, ...rest } = state.items;
            return { items: rest };
        });
    },
    setDoorOpenState: (doorId, value) => {
        set((state) => ({
            doors: {
                ...state.doors,
                [doorId]: {
                    ...state.doors[doorId],
                    ...value,
                },
            },
        }));
    },
    removeDoorOpenState: (doorId) => {
        set((state) => {
            const { [doorId]: _, ...rest } = state.doors;
            return { doors: rest };
        });
    },
    startDoorAnimation: (doorId, value) => {
        set((state) => ({
            doorAnimations: {
                ...state.doorAnimations,
                [doorId]: value,
            },
        }));
    },
    cancelDoorAnimation: (doorId) => {
        set((state) => {
            const { [doorId]: _, ...rest } = state.doorAnimations;
            return { doorAnimations: rest };
        });
    },
    setWindowOpenState: (windowId, value) => {
        set((state) => ({
            windows: {
                ...state.windows,
                [windowId]: {
                    ...state.windows[windowId],
                    ...value,
                },
            },
        }));
    },
    removeWindowOpenState: (windowId) => {
        set((state) => {
            const { [windowId]: _, ...rest } = state.windows;
            return { windows: rest };
        });
    },
    startWindowAnimation: (windowId, value) => {
        set((state) => ({
            windowAnimations: {
                ...state.windowAnimations,
                [windowId]: value,
            },
        }));
    },
    cancelWindowAnimation: (windowId) => {
        set((state) => {
            const { [windowId]: _, ...rest } = state.windowAnimations;
            return { windowAnimations: rest };
        });
    },
    setSkylightOpenState: (skylightId, value) => {
        set((state) => ({
            skylights: {
                ...state.skylights,
                [skylightId]: {
                    ...state.skylights[skylightId],
                    ...value,
                },
            },
        }));
    },
    removeSkylightOpenState: (skylightId) => {
        set((state) => {
            const { [skylightId]: _, ...rest } = state.skylights;
            return { skylights: rest };
        });
    },
    startSkylightAnimation: (skylightId, value) => {
        set((state) => ({
            skylightAnimations: {
                ...state.skylightAnimations,
                [skylightId]: value,
            },
        }));
    },
    cancelSkylightAnimation: (skylightId) => {
        set((state) => {
            const { [skylightId]: _, ...rest } = state.skylightAnimations;
            return { skylightAnimations: rest };
        });
    },
    initElevator: (elevatorId, levelId, carY) => {
        if (get().elevators[elevatorId])
            return;
        set((state) => ({
            elevators: {
                ...state.elevators,
                [elevatorId]: {
                    currentLevelId: levelId,
                    targetLevelId: null,
                    carY,
                    doorOpen: 0,
                    phase: 'idle',
                    phaseStartedAt: null,
                    queue: [],
                    requestedStops: [],
                },
            },
        }));
    },
    setElevatorState: (elevatorId, value) => {
        set((state) => {
            const current = state.elevators[elevatorId];
            if (!current)
                return state;
            return {
                elevators: {
                    ...state.elevators,
                    [elevatorId]: {
                        ...current,
                        ...value,
                    },
                },
            };
        });
    },
    removeElevator: (elevatorId) => {
        set((state) => {
            const { [elevatorId]: _, ...rest } = state.elevators;
            return { elevators: rest };
        });
    },
}));
