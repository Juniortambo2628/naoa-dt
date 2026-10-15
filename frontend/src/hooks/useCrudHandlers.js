import { useState, useCallback } from 'react';
import useAdminAction from './useAdminAction';

/**
 * Reusable CRUD handlers for admin pages, built on useAdminAction (so saves
 * and deletes get role checks, confirmation, feedback and refreshing for free).
 *
 * Full mode (default):  provides handleAdd, handleEdit, handleSave, handleDelete + modal state.
 * Delete-only mode:     provides handleDelete + isProcessing(id) (no modal).
 *
 * `removeAction` / `saveAction` are the underlying actions, for <Button action={…}>.
 */
export default function useCrudHandlers({ service, onRefresh, labels = {} }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleAdd = useCallback(() => {
    setSelectedItem(null);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((item) => {
    setSelectedItem(item);
    setModalOpen(true);
  }, []);

  /**
   * Delete with confirm dialog and per-item processing state.
   * If a `service` is provided the deletion goes through it; otherwise
   * callers pass an async `deleteFn` via options.
   */
  const removeAction = useAdminAction(
    (id, opts = {}) => (opts.deleteFn ? opts.deleteFn(id) : service?.delete?.(id)),
    {
      confirm: (id, opts = {}) => opts.confirmMessage || 'Delete this item?',
      success: labels.deleted,
      error: 'Failed to delete',
      onSuccess: () => onRefresh?.(),
    },
  );

  const saveAction = useAdminAction(
    (data) => (selectedItem ? service.update(selectedItem.id, data) : service.create(data)),
    {
      key: () => 'save',
      success: labels.saved,
      error: 'Failed to save',
      rethrow: true,
      onSuccess: () => {
        setModalOpen(false);
        setSelectedItem(null);
        onRefresh?.();
      },
    },
  );

  const handleDelete = removeAction.run;
  const handleSave = saveAction.run;

  return {
    selectedItem,
    modalOpen,
    setModalOpen,
    isProcessing: removeAction.isPending,
    handleAdd,
    handleEdit,
    handleDelete,
    handleSave,
    removeAction,
    saveAction,
  };
}
