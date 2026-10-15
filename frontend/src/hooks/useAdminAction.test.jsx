import { act, render, renderHook, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AuthContext from '../context/AuthContext'
import Button from '../components/Button'
import useAdminAction, { useBulkAdminAction } from './useAdminAction'

const toast = vi.hoisted(() => Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }))
vi.mock('react-hot-toast', () => ({ toast, default: toast }))

const feedback = vi.hoisted(() => ({ confirm: vi.fn() }))
vi.mock('../utils/feedback', async (importOriginal) => ({
  ...(await importOriginal()),
  confirmAction: (...args) => feedback.confirm(...args),
}))

function wrapperFor(role, queryClient = new QueryClient()) {
  return function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={{ user: { id: 1, name: 'T', role } }}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    )
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  feedback.confirm.mockResolvedValue(true)
})

describe('useAdminAction', () => {
  it('runs the write, toasts success and refreshes the given queries', async () => {
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const write = vi.fn().mockResolvedValue({ data: { id: 7 } })
    const { result } = renderHook(
      () => useAdminAction(write, { success: (res) => `Saved #${res.data.id}`, invalidate: [['faqs']] }),
      { wrapper: wrapperFor('editor', queryClient) },
    )

    let returned
    await act(async () => { returned = await result.current.run(7, 'x') })

    expect(write).toHaveBeenCalledWith(7, 'x')
    expect(returned).toEqual({ data: { id: 7 } })
    expect(toast.success).toHaveBeenCalledWith('Saved #7')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['faqs'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['revisions'] })
  })

  it('does nothing for viewers', async () => {
    const write = vi.fn()
    const { result } = renderHook(() => useAdminAction(write), { wrapper: wrapperFor('viewer') })
    expect(result.current.allowed).toBe(false)
    await act(async () => { await result.current.run() })
    expect(write).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('You have view-only access.', { id: 'role-denied' })
  })

  it('owner-only actions are not allowed for editors', () => {
    const { result } = renderHook(() => useAdminAction(vi.fn(), { role: 'owner' }), { wrapper: wrapperFor('editor') })
    expect(result.current.allowed).toBe(false)
  })

  it('stops when the confirmation is cancelled', async () => {
    feedback.confirm.mockResolvedValue(false)
    const write = vi.fn()
    const { result } = renderHook(() => useAdminAction(write, { confirm: (id) => `Delete ${id}?` }), { wrapper: wrapperFor('editor') })
    await act(async () => { await result.current.run(3) })
    expect(feedback.confirm).toHaveBeenCalledWith('Delete 3?')
    expect(write).not.toHaveBeenCalled()
  })

  it('reports failures, calls onError, and re-throws only when asked', async () => {
    const err = Object.assign(new Error('nope'), { response: { data: { message: 'Name is required' } } })
    const onError = vi.fn()
    const { result } = renderHook(() => useAdminAction(() => Promise.reject(err), { onError }), { wrapper: wrapperFor('editor') })
    await act(async () => { await result.current.run(1) })
    expect(toast.error).toHaveBeenCalledWith('Name is required')
    expect(onError).toHaveBeenCalledWith(err, 1)

    const { result: rethrowing } = renderHook(() => useAdminAction(() => Promise.reject(err), { rethrow: true }), { wrapper: wrapperFor('editor') })
    await expect(rethrowing.current.run()).rejects.toBe(err)
  })

  it('stays quiet on errors when the page shows them itself', async () => {
    const { result } = renderHook(() => useAdminAction(() => Promise.reject(new Error('x')), { error: false }), { wrapper: wrapperFor('editor') })
    await act(async () => { await result.current.run() })
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('tracks pending state per item', async () => {
    let finish
    const { result } = renderHook(() => useAdminAction(() => new Promise((r) => { finish = r })), { wrapper: wrapperFor('editor') })
    let running
    act(() => { running = result.current.run(5) })
    await waitFor(() => expect(result.current.isPending(5)).toBe(true))
    expect(result.current.isPending(6)).toBe(false)
    await act(async () => { finish(); await running })
    expect(result.current.pending).toBe(false)
  })
})

describe('useBulkAdminAction', () => {
  it('applies the rest and says how many failed', async () => {
    const write = vi.fn((id) => (id === 2 ? Promise.reject(new Error('x')) : Promise.resolve()))
    const { result } = renderHook(() => useBulkAdminAction(write), { wrapper: wrapperFor('editor') })
    await act(async () => { await result.current.run([1, 2, 3]) })
    expect(write).toHaveBeenCalledTimes(3)
    expect(toast.error).toHaveBeenCalledWith("1 of 3 couldn't be updated")
  })
})

describe('Button with an action', () => {
  function Row({ write }) {
    const remove = useAdminAction(write, { success: 'Deleted' })
    return <Button action={remove} args={[9]}>Delete</Button>
  }

  it('runs the action on click', async () => {
    const write = vi.fn().mockResolvedValue({})
    render(<Row write={write} />, { wrapper: wrapperFor('editor') })
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(write).toHaveBeenCalledWith(9))
  })

  it('is hidden for viewers', () => {
    render(<Row write={vi.fn()} />, { wrapper: wrapperFor('viewer') })
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull()
  })
})
