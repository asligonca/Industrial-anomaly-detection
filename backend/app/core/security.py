from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher

password_hash = PasswordHash((BcryptHasher(),))


def hash_password(password: str) -> str:
    """Parolayı bcrypt ile hash'ler. DB'ye yalnızca bu değer yazılır."""
    return password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    """Düz parolanın hash ile eşleşip eşleşmediğini döner."""
    return password_hash.verify(password, hashed)
