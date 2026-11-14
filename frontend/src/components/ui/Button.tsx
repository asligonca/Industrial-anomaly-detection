import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'
import {
  buttonClass,
  iconButtonClass,
  type ButtonSize,
  type ButtonVariant,
  type IconButtonSize,
  type IconButtonVariant,
} from './buttonStyles'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
}

/** Birincil (koyu) ve ikincil (çerçeveli) düğme. Form içinde göndermek için `type="submit"` ver. */
export function Button({
  variant = 'primary',
  size = 'lg',
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />
}

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant
  size?: ButtonSize
}

/** Düğme görünümlü bağlantı (sayfa değiştiren eylemler için). */
export function LinkButton({
  variant = 'secondary',
  size = 'md',
  className,
  ...rest
}: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />
}

interface IconButtonProps extends Omit<ComponentProps<'button'>, 'aria-label'> {
  /** Ekran okuyucu adı; ikon düğmesinde görünür yazı olmadığı için zorunlu. */
  label: string
  variant?: IconButtonVariant
  size?: IconButtonSize
}

/** Yalnızca ikonlu düğme (ses aç/kapat, kapat ×, mikrofon). */
export function IconButton({
  label,
  variant = 'ghost',
  size = 'sm',
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={iconButtonClass(variant, size, className)}
      {...rest}
    />
  )
}
