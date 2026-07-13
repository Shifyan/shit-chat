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