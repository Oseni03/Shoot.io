"""
Domain Glossary for FastAPI SaaS Boilerplate

### User
An individual with login credentials, email address, and authentication status. A User can create Organizations and be a member of multiple Organizations.

### Organization  
A business entity with its own plan tier, members, invitations, and billing. Organizations have hierarchy through MemberRoles (owner, admin, member, viewer).

### Member
The relationship between a User and an Organization, with permissions defined by MemberRole. Membership establishes access control boundaries within an Organization.

### MemberRole
Enumeration of organizational roles with increasing privilege:
- OWNER: Full control, can transfer ownership
- ADMIN: Can manage all members except other owners
- MEMBER: Can access resources but not manage team
- VIEWER: Read-only access to organization resources

### PlanTier
Pricing tiers with assigned limits:
- FREE: Limited to 5 members, 3 projects, 3 shots/month
- PRO: 50 members, unlimited projects, unlimited shots
- ULTIMATE: Unlimited members, unlimited shots, security features enabled (legacy `ENTERPRISE` value kept for zero-downtime migration)

### Resource
Something within an Organization that can be accessed (projects, audit logs, billing, etc.)

### Permission
The capability granted to a MemberRole to perform an action on a Resource

### Ownership
The relationship between User and Organization where the User has sole administrative control

### Resume
A user-authored resume with six sections (Experience, Education, Skill, Summary, Project, Certification). Scoped to User (not Organization). Exactly one `is_master: true` per user, enforced by DB partial unique index.

### JobDescription
A scraped job posting stored for provenance when a resume is tailored. Immutable after creation.

### TailoredResume
Immutable snapshot of AI-tailored resume content from a Shoot. References source Resume and JobDescription.

### UserMonthlyUsage
Shot-counter per user per calendar month. Upserted by ShotService. Resets implicitly on new month.

### Shot
The billable unit consumed by one Shoot action. FREE: 3/month, PRO/ULTIMATE: unlimited.

### Shoot
End-to-end flow: tailor master resume against JD via AI → record shot → map autofill fields. One click on Indeed.

## Key Constraints

- Role-based access control uses a numeric hierarchy: VIEWER(0) < MEMBER(1) < ADMIN(2) < OWNER(3)
- Plan limits enforce quotas on organizational resources (max_members, max_projects, max_shots_per_month)
- Permission checks verify both membership and role hierarchy before allowing actions
- All organizational operations go through Member validation first
- Resume data is User-scoped, not Organization-scoped — queries filter by user_id
- Shot limit check and increment are NOT atomic (see Issue 019 for planned fix)
"""