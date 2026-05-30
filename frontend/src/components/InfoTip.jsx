import React from 'react'

export default function InfoTip({ text, align = 'left' }) {
  return (
    <span className="info-tip">
      <svg className="info-tip-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
        <circle cx="8" cy="5.2" r="0.9" fill="currentColor"/>
        <path d="M8 7.5v3.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span className={`info-tip-text${align === 'right' ? ' info-tip-right' : align === 'center' ? ' info-tip-center' : ''}`}>{text}</span>
    </span>
  )
}
