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

func (r *UserRepository) CreateUser(fullname, email, hashedPassword string) error {
	query := `INSERT INTO users (fullname, email, password, created_at) VALUES ($1, $2, $3, $4)`
	_, err := r.db.Exec(query, fullname, email, hashedPassword, time.Now())
	return err
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