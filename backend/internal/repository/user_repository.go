package repository

import (
	"database/sql"
	"time"
)

type User struct {
	ID int64 `json:"id"`
	Fullname string `json:"fullname"`
	Email string `json:"email"`
	Password string `json:"-"`
	CreatedAt time.Time `json:"created_at"`
}

type UserRepository struct{
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) CreateUser(fullname, email, hashedPassword string) (int64, error) {
	query := `INSERT INTO users (fullname, email, password, created_at) VALUES ($1, $2, $3, $4) RETURNING id`
	var id int64
	err := r.db.QueryRow(query, fullname, email, hashedPassword, time.Now()).Scan(&id)
	return id, err
}

func (r *UserRepository) GetUserByEmail(email string)(*User, error){
	query := `SELECT id, fullname, email, password, created_at FROM users WHERE email = $1`
	row := r.db.QueryRow(query, email)

	var user User
	err := row.Scan(&user.ID, &user.Fullname, &user.Email, &user.Password, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByID returns a user by their ID (without the password hash).
func (r *UserRepository) GetUserByID(id int64) (*User, error) {
	query := `SELECT id, fullname, email, created_at FROM users WHERE id = $1`
	row := r.db.QueryRow(query, id)

	var user User
	err := row.Scan(&user.ID, &user.Fullname, &user.Email, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateProfile updates a user's fullname and email.
func (r *UserRepository) UpdateProfile(id int64, fullname, email string) error {
	_, err := r.db.Exec(
		`UPDATE users SET fullname = $2, email = $3 WHERE id = $1`,
		id, fullname, email,
	)
	return err
}

// GetUserPassword returns the bcrypt hash for a user (password change verification).
func (r *UserRepository) GetUserPassword(id int64) (string, error) {
	var hash string
	err := r.db.QueryRow(`SELECT password FROM users WHERE id = $1`, id).Scan(&hash)
	return hash, err
}

// UpdatePassword sets a new bcrypt hash.
func (r *UserRepository) UpdatePassword(id int64, hashed string) error {
	_, err := r.db.Exec(`UPDATE users SET password = $2 WHERE id = $1`, id, hashed)
	return err
}

// UserBrief is a lighter projection for search results.
type UserBrief struct {
	ID       int64  `json:"id"`
	Fullname string `json:"fullname"`
	Email    string `json:"email"`
}

// SearchUsers returns users whose fullname or email matches the query (case-insensitive prefix).
// It excludes the given user ID and limits results.
func (r *UserRepository) SearchUsers(q string, excludeID int64, limit int) ([]UserBrief, error) {
	query := `SELECT id, fullname, email FROM users
		WHERE (LOWER(fullname) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1))
		AND id != $2
		ORDER BY fullname ASC
		LIMIT $3`

	rows, err := r.db.Query(query, q+"%", excludeID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []UserBrief
	for rows.Next() {
		var u UserBrief
		if err := rows.Scan(&u.ID, &u.Fullname, &u.Email); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}