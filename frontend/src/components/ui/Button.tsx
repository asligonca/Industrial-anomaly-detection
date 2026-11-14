import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'
import { buttonClass, type ButtonSize, type ButtonVariant } from './buttonStyles'

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
