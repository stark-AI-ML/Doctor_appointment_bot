import { doctorService } from '../services/doctorService'

const ROLES = ['receptionist', 'pharmacy', 'doctor', 'admin', 'superadmin']

const EMPTY = {
  name: '', email: '', password: '', role: 'receptionist', doctorId: '',
  phone: '', salary: '', joiningDate: '', address: '',
}

/**
 * Staff Management (superadmin/admin) — create/update receptionists,
 * pharmacists, doctors and admins incl. salary. Staff codes (KGN_RC_### …)
 * are auto-generated; most fields required in the UI.
 */
export default function Staff() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const debouncedSearch = useDebounce(search, 400)

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', roleFilter, debouncedSearch],
    queryFn: () => staffService.getStaff(roleFilter, debouncedSearch),
  })

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: doctorService.getDoctors,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['staff'] })

  const saveMutation = useMutation({
    mutationFn: () => (editing
      ? staffService.updateStaff(editing.id, form)
      : staffService.createStaff(form)),
    onSuccess: () => {
      invalidate()
      toast.success(editing ? 'Staff updated' : 'Staff created')
      setShowForm(false)
      setEditing(null)
      setForm(EMPTY)
    },
    onError: (err) => toast.error(err.message || 'Save failed'),
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => staffService.toggleActive(id),
    onSuccess: () => {
      invalidate()
      toast.success('Status updated')
    },
    onError: () => toast.error('Update failed'),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  const openEdit = (user) => {
    setEditing(user)
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'receptionist',
      doctorId: user.doctorId || '',
      phone: user.phone || '',
      salary: user.salary ?? '',
      joiningDate: user.joiningDate ? String(user.joiningDate).slice(0, 10) : '',
      address: user.address || '',
    })
    setShowForm(true)
  }

  const set = (key) => (e) => {
    let value = e.target.value
    if (key === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10)
    }
    setForm((f) => ({ ...f, [key]: value }))
  }

  const copyCode = (code) => {
    if (navigator.clipboard && code) {
      navigator.clipboard.writeText(code)
      toast.success(`Copied staff code: ${code}`)
    }
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!form.name.trim() || form.name.trim().length < 2) return toast.error('Name is required')
    if (!form.email.trim()) return toast.error('Email is required')
    if (!editing && (!form.password || form.password.length < 6)) return toast.error('Password (6+ chars) is required')
    if (form.phone.replace(/\D/g, '').length < 10) return toast.error('Valid 10-digit mobile number is required')
    if (form.salary === '' || Number(form.salary) < 0) return toast.error('Salary is required')
    if (form.role === 'doctor' && !form.doctorId) return toast.error('Please assign a doctor profile for doctor role')
    saveMutation.mutate()
  }

  const columns = ['Staff Code', 'Name', 'Role', 'Phone', 'Salary', 'Status', 'Actions']

  const renderRow = (u) => (
    <tr key={u.id} style={{ opacity: u.is_active === false ? 0.55 : 1 }}>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <span className={styles.code} onClick={() => copyCode(u.staffCode)} style={{ cursor: 'pointer' }} title="Click to copy">
          {u.staffCode || '—'}
        </span>
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <div style={{ fontWeight: 500 }}>{u.name}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</div>
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)', textTransform: 'capitalize' }}>
        {u.role}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
        {u.phone || '—'}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        {u.salary ? formatCurrency(u.salary) : '—'}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <span className={u.is_active === false ? styles.inactive : styles.active}>
          {u.is_active === false ? 'Inactive' : 'Active'}
        </span>
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <div className={styles.rowActions}>
          <button className={styles.actionBtn} onClick={() => openEdit(u)} title="Edit">
            <Pencil size={16} />
          </button>
          <button className={styles.actionBtn} onClick={() => toggleMutation.mutate(u.id)} title="Toggle active">
            <Power size={16} />
          </button>
        </div>
      </td>
    </tr>
  )

  return (
    <div className={styles.page}>
      <PageHeader
        title="Staff Management"
        subtitle="Receptionists, pharmacists, doctors and admins · codes auto-generated (KGN_RC_### …)"
        icon={ClipboardList}
        actions={<Button icon={Plus} onClick={openCreate}>Add Staff</Button>}
      />
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIconInline} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search name, email or staff code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={styles.select} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <Card noPadding>
        {isLoading ? <Loader /> : (
          <Table columns={columns} data={staff || []} renderRow={renderRow} emptyMessage="No staff found" />
        )}
      </Card>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? `Edit ${editing.staffCode || 'Staff'}` : 'Add Staff'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {editing ? 'Save Changes' : 'Create Staff'}
            </Button>
          </>
        }
      >
        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.row}>
            <FormField label="Full Name" required>
              <input value={form.name} onChange={set('name')} placeholder="e.g. Front Desk" />
            </FormField>
            <FormField label="Email (login)" required>
              <input type="email" value={form.email} onChange={set('email')} placeholder="name@kgnanda.com" disabled={!!editing} />
            </FormField>
          </div>
          {!editing && (
            <FormField label="Password" hint="6+ characters" required>
              <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
            </FormField>
          )}
          <div className={styles.row}>
            <FormField label="Role" required>
              <select value={form.role} onChange={set('role')}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </FormField>
            <FormField label="Phone" required>
              <input value={form.phone} onChange={set('phone')} placeholder="10-digit mobile" inputMode="tel" />
            </FormField>
          </div>
          {form.role === 'doctor' && (
            <FormField label="Linked Doctor Profile" hint="Required for doctor role" required>
              <select value={form.doctorId} onChange={set('doctorId')}>
                <option value="">— Select doctor profile —</option>
                {doctors?.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialization})</option>
                ))}
              </select>
            </FormField>
          )}
          <div className={styles.row}>
            <FormField label="Salary (₹/month)" required>
              <input type="number" min="0" value={form.salary} onChange={set('salary')} placeholder="e.g. 18000" />
            </FormField>
            <FormField label="Joining Date">
              <input type="date" value={form.joiningDate} onChange={set('joiningDate')} />
            </FormField>
          </div>
          <FormField label="Address">
            <input value={form.address} onChange={set('address')} placeholder="Residential address" />
          </FormField>
          {editing?.staffCode && (
            <p className={styles.codeNote}>Staff code <strong>{editing.staffCode}</strong> • Joined {formatDate(editing.joiningDate)}</p>
          )}
        </form>
      </Modal>
    </div>
  )
}
