import {
  createContext,
  useContext,
  useState,
  useCallback,
  type FC,
  type ReactNode,
} from "react";

export interface AmendmentState {
  removedFields: Set<string>;
  removedAddedItems: Map<string, Set<number>>;
  removedRemovedItems: Map<string, Set<number>>;
}

interface AmendmentContextValue {
  state: AmendmentState;
  clearField: (field: string) => void;
  clearAddedItem: (field: string, index: number) => void;
  clearRemovedItem: (field: string, index: number) => void;
  restoreField: (field: string) => void;
  restoreAddedItem: (field: string, index: number) => void;
  restoreRemovedItem: (field: string, index: number) => void;
  hasChanges: boolean;
}

const AmendmentContext = createContext<AmendmentContextValue | null>(null);

export const useAmendment = () => {
  const context = useContext(AmendmentContext);
  if (!context) {
    throw new Error("useAmendment must be used within AmendmentProvider");
  }
  return context;
};

export const useAmendmentOptional = () => useContext(AmendmentContext);

interface AmendmentProviderProps {
  children: ReactNode;
}

export const AmendmentProvider: FC<AmendmentProviderProps> = ({ children }) => {
  const [removedFields, setRemovedFields] = useState<Set<string>>(new Set());
  const [removedAddedItems, setRemovedAddedItems] = useState<
    Map<string, Set<number>>
  >(new Map());
  const [removedRemovedItems, setRemovedRemovedItems] = useState<
    Map<string, Set<number>>
  >(new Map());

  const clearField = useCallback((field: string) => {
    setRemovedFields((prev) => {
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  }, []);

  const clearAddedItem = useCallback((field: string, index: number) => {
    setRemovedAddedItems((prev) => {
      const next = new Map(prev);
      const indices = next.get(field) ?? new Set<number>();
      indices.add(index);
      next.set(field, indices);
      return next;
    });
  }, []);

  const clearRemovedItem = useCallback((field: string, index: number) => {
    setRemovedRemovedItems((prev) => {
      const next = new Map(prev);
      const indices = next.get(field) ?? new Set<number>();
      indices.add(index);
      next.set(field, indices);
      return next;
    });
  }, []);

  const restoreField = useCallback((field: string) => {
    setRemovedFields((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }, []);

  const restoreAddedItem = useCallback((field: string, index: number) => {
    setRemovedAddedItems((prev) => {
      const next = new Map(prev);
      const indices = next.get(field);
      if (indices) {
        indices.delete(index);
        if (indices.size === 0) {
          next.delete(field);
        } else {
          next.set(field, indices);
        }
      }
      return next;
    });
  }, []);

  const restoreRemovedItem = useCallback((field: string, index: number) => {
    setRemovedRemovedItems((prev) => {
      const next = new Map(prev);
      const indices = next.get(field);
      if (indices) {
        indices.delete(index);
        if (indices.size === 0) {
          next.delete(field);
        } else {
          next.set(field, indices);
        }
      }
      return next;
    });
  }, []);

  const hasChanges =
    removedFields.size > 0 ||
    Array.from(removedAddedItems.values()).some((s) => s.size > 0) ||
    Array.from(removedRemovedItems.values()).some((s) => s.size > 0);

  const value: AmendmentContextValue = {
    state: {
      removedFields,
      removedAddedItems,
      removedRemovedItems,
    },
    clearField,
    clearAddedItem,
    clearRemovedItem,
    restoreField,
    restoreAddedItem,
    restoreRemovedItem,
    hasChanges,
  };

  return (
    <AmendmentContext.Provider value={value}>
      {children}
    </AmendmentContext.Provider>
  );
};
