import { useState, useCallback } from "react";
import type {
  DataGridState,
  UploadedFile,
  Client,
  Worker,
  Task,
} from "@/types";

const initialState: DataGridState = {
  clients: [],
  workers: [],
  tasks: [],
  validationErrors: [],
  selectedRows: {},
  editingCell: null,
};

export function useDataStore() {
  const [dataState, setDataState] = useState<DataGridState>(initialState);

  const uploadFiles = useCallback(async (files: UploadedFile[]) => {
    const results: any[] = [];

    for (const file of files) {
      if (file.result && file.status === "completed") {
        results.push(file.result);
      }
    }

    // Merge all results
    let allClients: Client[] = [];
    let allWorkers: Worker[] = [];
    let allTasks: Task[] = [];

    results.forEach((result) => {
      if (result.clients) allClients = [...allClients, ...result.clients];
      if (result.workers) allWorkers = [...allWorkers, ...result.workers];
      if (result.tasks) allTasks = [...allTasks, ...result.tasks];
    });

    setDataState((prev) => ({
      ...prev,
      clients: allClients,
      workers: allWorkers,
      tasks: allTasks,
    }));

    return results;
  }, []);

  const updateData = useCallback(
    async (
      entityType: "clients" | "workers" | "tasks",
      entityId: string,
      field: string,
      value: any
    ) => {
      // Handle create operation
      if (field === "create") {
        setDataState((prev) => ({
          ...prev,
          [entityType]: [...prev[entityType], value],
        }));
        return;
      }

      // Handle update operation
      setDataState((prev) => ({
        ...prev,
        [entityType]: prev[entityType].map((entity) => {
          const id = getEntityId(entity);
          if (id === entityId) {
            return { ...entity, [field]: value };
          }
          return entity;
        }),
      }));
    },
    []
  );

  const deleteRow = useCallback(
    (entityType: "clients" | "workers" | "tasks", entityId: string) => {
      setDataState((prev) => ({
        ...prev,
        [entityType]: prev[entityType].filter((entity) => {
          const id = getEntityId(entity);
          return id !== entityId;
        }),
      }));
    },
    []
  );

  const deleteColumn = useCallback(
    (entityType: "clients" | "workers" | "tasks", columnKey: string) => {
      // Remove the column from all entities of this type
      setDataState((prev) => ({
        ...prev,
        [entityType]: prev[entityType].map((entity) => {
          const newEntity = { ...entity };
          delete newEntity[columnKey as keyof typeof entity];
          return newEntity;
        }),
      }));
    },
    []
  );

  const clearData = useCallback(() => {
    setDataState(initialState);
  }, []);

  const selectRows = useCallback(
    (entityType: "clients" | "workers" | "tasks", ids: string[]) => {
      setDataState((prev) => ({
        ...prev,
        selectedRows: {
          ...prev.selectedRows,
          ...ids.reduce(
            (acc, id) => ({ ...acc, [`${entityType}-${id}`]: true }),
            {}
          ),
        },
      }));
    },
    []
  );

  const clearSelection = useCallback(() => {
    setDataState((prev) => ({
      ...prev,
      selectedRows: {},
    }));
  }, []);

  const setEditingCell = useCallback(
    (entityType: string, entityId: string, field: string) => {
      setDataState((prev) => ({
        ...prev,
        editingCell: { entityType, entityId, field },
      }));
    },
    []
  );

  const clearEditingCell = useCallback(() => {
    setDataState((prev) => ({
      ...prev,
      editingCell: null,
    }));
  }, []);

  return {
    dataState,
    uploadFiles,
    updateData,
    deleteRow,
    deleteColumn,
    clearData,
    selectRows,
    clearSelection,
    setEditingCell,
    clearEditingCell,
  };
}

function getEntityId(entity: Client | Worker | Task): string {
  if ("ClientID" in entity) return entity.ClientID;
  if ("WorkerID" in entity) return entity.WorkerID;
  if ("TaskID" in entity) return entity.TaskID;
  return "";
}
