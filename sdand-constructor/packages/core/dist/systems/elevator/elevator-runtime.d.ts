import type { AnyNodeId, ElevatorNode } from '../../schema';
import { type ElevatorInteractiveState } from '../../store/use-interactive';
import { type ElevatorLevelEntry } from './elevator-service';
export declare function createElevatorInteractiveState(levelId: AnyNodeId, carY: number): ElevatorInteractiveState;
export declare function queueElevatorRequest(state: ElevatorInteractiveState, levelId: AnyNodeId): ElevatorInteractiveState;
export declare function openElevatorDoorState(state: ElevatorInteractiveState): ElevatorInteractiveState;
export declare function requestElevatorLevel(elevatorId: AnyNodeId, levelId: AnyNodeId): void;
export declare function openElevatorDoor(elevatorId: AnyNodeId): void;
export declare function stepElevatorRuntimeState({ defaultEntry, delta, elevator, entries, now, state, }: {
    defaultEntry: ElevatorLevelEntry;
    delta: number;
    elevator: ElevatorNode;
    entries: ElevatorLevelEntry[];
    now: number;
    state: ElevatorInteractiveState;
}): ElevatorInteractiveState;
export declare function stepElevatorRuntimes(now: number, delta: number): void;
//# sourceMappingURL=elevator-runtime.d.ts.map