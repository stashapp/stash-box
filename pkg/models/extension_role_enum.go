package models

func (r RoleEnum) Implies(other RoleEnum) bool {
	// admin has all roles
	if r == RoleEnumAdmin {
		return true
	}

	// until we add a NONE value, all values imply read
	if r.IsValid() && other == RoleEnumRead {
		return true
	}

	// all others only imply themselves
	return r == other
}
