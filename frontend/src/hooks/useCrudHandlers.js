import { useState, useCallback } from 'react';

/**
 * Reusable CRUD handlers for admin pages.
 *
 * Full mode (default):  provides handleAdd, handleEdit, handleSave, handleDelete + modal state.
 * Delete-only mode:     provides handleDelete + processing state (no modal).
 */
export default function useCrudHandlers({ service, onRefresh }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [processing, setProcessing] = useState(null);

  const handleAdd = useCallback(() => {
    setSelectedItem(null);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((item) => {
    setSelectedItem(item);
    setModalOpen(true);
  }, []);

  /**
   * Delete with confirm dialog and optional processing state.
   * If a `service` is provided the deletion goes through it.
   * Otherwise callers can pass an async `deleteFn` via options.
   */
  const handleDelete = useCallback(async (id, opts = {}) => {
    const { confirmMessage = 'Delete this item?', deleteFn } = opts;

    if (!window.confirm(confirmMessage)) return;
    setProcessing(id);
    try {
      if (deleteFn) {
        await deleteFn(id);
      } else if (service?.delete) {
        await service.delete(id);
      }
      onRefresh?.();
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    }
    setProcessing(null);
  }, [service, onRefresh]);

  const handleSave = useCallback(async (data) => {
    try {
      if (selectedItem) {
        await service.update(selectedItem.id, data);
      } else {
        await service.create(data);
      }
      setModalOpen(false);
      setSelectedItem(null);
      onRefresh?.();
    } catch (err) {
      console.error(err);
      alert('Failed to save');
      throw err;
    }
  }, [selectedItem, service, onRefresh]);

  return {
    selectedItem,
    modalOpen,
    setModalOpen,
    processing,
    handleAdd,
    handleEdit,
    handleDelete,
    handleSave,
  };
}
