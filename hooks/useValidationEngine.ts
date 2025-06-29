import { useState, useCallback, useEffect } from "react";
import type {
  DataGridState,
  ValidationError,
  ValidationErrorType,
} from "@/types";

export function useValidationEngine(dataState: DataGridState) {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [isValidating, setIsValidating] = useState(false);

  const runValidation = useCallback(async () => {
    setIsValidating(true);
    const errors: ValidationError[] = [];

    try {
      // Run all validation checks
      errors.push(
        ...(await validateClients(dataState.clients, dataState.tasks))
      );
      errors.push(...(await validateWorkers(dataState.workers)));
      errors.push(...(await validateTasks(dataState.tasks, dataState.workers)));
      errors.push(...(await validateCrossReferences(dataState)));

      setValidationErrors(errors);
    } catch (error) {
      console.error("Validation error:", error);
    } finally {
      setIsValidating(false);
    }
  }, [dataState]);

  const fixValidationError = useCallback(
    async (errorId: string) => {
      const error = validationErrors.find((e) => e.id === errorId);
      if (!error || !error.autoFixable) return;

      // Apply auto-fix logic based on error type
      // This would be implemented based on specific error types
      console.log("Auto-fixing error:", error);

      // Re-run validation after fix
      await runValidation();
    },
    [validationErrors, runValidation]
  );

  const validationSummary = {
    totalErrors: validationErrors.length,
    criticalErrors: validationErrors.filter((e) => e.severity === "error")
      .length,
    warnings: validationErrors.filter((e) => e.severity === "warning").length,
    errorsByType: validationErrors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<ValidationErrorType, number>),
  };

  // Auto-validate when data changes
  useEffect(() => {
    if (
      dataState.clients.length > 0 ||
      dataState.workers.length > 0 ||
      dataState.tasks.length > 0
    ) {
      runValidation();
    }
  }, [dataState, runValidation]);

  return {
    validationErrors,
    validationSummary,
    isValidating,
    runValidation,
    fixValidationError,
  };
}

async function validateClients(
  clients: any[],
  tasks: any[]
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const clientIds = new Set<string>();

  for (const client of clients) {
    // Check for duplicate IDs
    if (clientIds.has(client.ClientID)) {
      errors.push({
        id: `client-duplicate-${client.ClientID}`,
        type: "duplicate_id" as ValidationErrorType,
        entity: "clients",
        entityId: client.ClientID,
        field: "ClientID",
        message: `Duplicate client ID: ${client.ClientID}`,
        severity: "error",
        autoFixable: false,
      });
    }
    clientIds.add(client.ClientID);

    // Check priority level range
    if (client.PriorityLevel < 1 || client.PriorityLevel > 5) {
      errors.push({
        id: `client-priority-${client.ClientID}`,
        type: "out_of_range" as ValidationErrorType,
        entity: "clients",
        entityId: client.ClientID,
        field: "PriorityLevel",
        message: `Priority level must be between 1-5, got ${client.PriorityLevel}`,
        severity: "error",
        suggestion: "Set priority level to a value between 1 and 5",
        autoFixable: true,
      });
    }

    // Check requested task references
    if (client.RequestedTaskIDs && Array.isArray(client.RequestedTaskIDs)) {
      const taskIds = new Set(tasks.map((t) => t.TaskID));
      const invalidTasks = client.RequestedTaskIDs.filter(
        (taskId: string) => !taskIds.has(taskId)
      );

      if (invalidTasks.length > 0) {
        errors.push({
          id: `client-invalid-tasks-${client.ClientID}`,
          type: "unknown_reference" as ValidationErrorType,
          entity: "clients",
          entityId: client.ClientID,
          field: "RequestedTaskIDs",
          message: `References non-existent tasks: ${invalidTasks.join(", ")}`,
          severity: "error",
          autoFixable: false,
        });
      }
    }

    // Validate JSON attributes
    try {
      if (typeof client.AttributesJSON === "string") {
        JSON.parse(client.AttributesJSON);
      }
    } catch {
      errors.push({
        id: `client-json-${client.ClientID}`,
        type: "broken_json" as ValidationErrorType,
        entity: "clients",
        entityId: client.ClientID,
        field: "AttributesJSON",
        message: "Invalid JSON in AttributesJSON field",
        severity: "error",
        autoFixable: true,
      });
    }
  }

  return errors;
}

async function validateWorkers(workers: any[]): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const workerIds = new Set<string>();

  for (const worker of workers) {
    // Check for duplicate IDs
    if (workerIds.has(worker.WorkerID)) {
      errors.push({
        id: `worker-duplicate-${worker.WorkerID}`,
        type: "duplicate_id" as ValidationErrorType,
        entity: "workers",
        entityId: worker.WorkerID,
        field: "WorkerID",
        message: `Duplicate worker ID: ${worker.WorkerID}`,
        severity: "error",
        autoFixable: false,
      });
    }
    workerIds.add(worker.WorkerID);

    // Check available slots format
    if (worker.AvailableSlots && Array.isArray(worker.AvailableSlots)) {
      const invalidSlots = worker.AvailableSlots.filter(
        (slot: any) => typeof slot !== "number" || slot < 1 || slot > 10
      );

      if (invalidSlots.length > 0) {
        errors.push({
          id: `worker-slots-${worker.WorkerID}`,
          type: "malformed_list" as ValidationErrorType,
          entity: "workers",
          entityId: worker.WorkerID,
          field: "AvailableSlots",
          message: `Invalid slots: ${invalidSlots.join(
            ", "
          )}. Slots must be numbers 1-10`,
          severity: "error",
          autoFixable: true,
        });
      }
    }

    // Check max load per phase
    if (worker.MaxLoadPerPhase < 0) {
      errors.push({
        id: `worker-load-${worker.WorkerID}`,
        type: "out_of_range" as ValidationErrorType,
        entity: "workers",
        entityId: worker.WorkerID,
        field: "MaxLoadPerPhase",
        message: "MaxLoadPerPhase cannot be negative",
        severity: "error",
        autoFixable: true,
      });
    }

    // Check if worker is overloaded
    if (worker.AvailableSlots && worker.MaxLoadPerPhase) {
      if (worker.AvailableSlots.length < worker.MaxLoadPerPhase) {
        errors.push({
          id: `worker-overload-${worker.WorkerID}`,
          type: "overloaded_worker" as ValidationErrorType,
          entity: "workers",
          entityId: worker.WorkerID,
          message: `Worker has ${worker.AvailableSlots.length} available slots but max load is ${worker.MaxLoadPerPhase}`,
          severity: "warning",
          autoFixable: true,
        });
      }
    }
  }

  return errors;
}

async function validateTasks(
  tasks: any[],
  workers: any[]
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const taskIds = new Set<string>();

  for (const task of tasks) {
    // Check for duplicate IDs
    if (taskIds.has(task.TaskID)) {
      errors.push({
        id: `task-duplicate-${task.TaskID}`,
        type: "duplicate_id" as ValidationErrorType,
        entity: "tasks",
        entityId: task.TaskID,
        field: "TaskID",
        message: `Duplicate task ID: ${task.TaskID}`,
        severity: "error",
        autoFixable: false,
      });
    }
    taskIds.add(task.TaskID);

    // Check duration
    if (task.Duration < 1) {
      errors.push({
        id: `task-duration-${task.TaskID}`,
        type: "out_of_range" as ValidationErrorType,
        entity: "tasks",
        entityId: task.TaskID,
        field: "Duration",
        message: "Duration must be at least 1",
        severity: "error",
        autoFixable: true,
      });
    }

    // Check max concurrent
    if (task.MaxConcurrent < 1) {
      errors.push({
        id: `task-concurrent-${task.TaskID}`,
        type: "out_of_range" as ValidationErrorType,
        entity: "tasks",
        entityId: task.TaskID,
        field: "MaxConcurrent",
        message: "MaxConcurrent must be at least 1",
        severity: "error",
        autoFixable: true,
      });
    }
  }

  return errors;
}

async function validateCrossReferences(
  dataState: DataGridState
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // Check skill coverage
  const allRequiredSkills = new Set<string>();
  dataState.tasks.forEach((task) => {
    if (task.RequiredSkills && Array.isArray(task.RequiredSkills)) {
      task.RequiredSkills.forEach((skill) => allRequiredSkills.add(skill));
    }
  });

  const allWorkerSkills = new Set<string>();
  dataState.workers.forEach((worker) => {
    if (worker.Skills && Array.isArray(worker.Skills)) {
      worker.Skills.forEach((skill) => allWorkerSkills.add(skill));
    }
  });

  const uncoveredSkills = Array.from(allRequiredSkills).filter(
    (skill) => !allWorkerSkills.has(skill)
  );

  if (uncoveredSkills.length > 0) {
    errors.push({
      id: "skill-coverage-global",
      type: "skill_coverage" as ValidationErrorType,
      entity: "tasks",
      entityId: "global",
      message: `No workers have these required skills: ${uncoveredSkills.join(
        ", "
      )}`,
      severity: "error",
      autoFixable: false,
    });
  }

  return errors;
}
