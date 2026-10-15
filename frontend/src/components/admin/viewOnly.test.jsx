import { render, screen } from '@testing-library/react';
import { Plus, Download } from 'lucide-react';
import AuthContext from '../../context/AuthContext';
import { SearchProvider } from '../../context/SearchContext';
import Button from '../Button';
import AdminFloatingToolbar from './AdminFloatingToolbar';
import EditableFieldset from './EditableFieldset';
import DeleteButton from './DeleteButton';

const as = (role, ui) => render(
  <AuthContext.Provider value={{ user: { id: 1, name: 'T', role } }}>
    <SearchProvider>{ui}</SearchProvider>
  </AuthContext.Provider>,
);

const actions = [
  { id: 'add', label: 'Add Guest', icon: Plus, onClick: () => {} },
  { id: 'export', label: 'Export', icon: Download, onClick: () => {}, readOnly: true },
];

describe('view-only collaborators', () => {
  it('hides edit buttons for viewers only', () => {
    as('viewer', <><Button edit>Save</Button><Button>View</Button><DeleteButton onClick={() => {}} /></>);
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
  });

  it('keeps edit buttons for editors', () => {
    as('editor', <Button edit>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('keeps only read-only toolbar actions for viewers', () => {
    as('viewer', <AdminFloatingToolbar actions={actions} />);
    expect(screen.queryByText('Add Guest')).toBeNull();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('shows every toolbar action to editors', () => {
    as('editor', <AdminFloatingToolbar actions={actions} />);
    expect(screen.getByText('Add Guest')).toBeInTheDocument();
  });

  it('disables form fields for viewers unless allowed', () => {
    const { unmount } = as('viewer', <EditableFieldset><input aria-label="Name" /></EditableFieldset>);
    expect(screen.getByLabelText('Name')).toBeDisabled();
    unmount();
    as('viewer', <EditableFieldset allow><input aria-label="Name" /></EditableFieldset>);
    expect(screen.getByLabelText('Name')).not.toBeDisabled();
  });
});
