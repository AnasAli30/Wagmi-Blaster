'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRocket, faCoins, faTimes } from '@fortawesome/free-solid-svg-icons'
import { useMiniAppContext } from '@/hooks/use-miniapp-context'
import { authenticatedFetch } from '@/docs/lib/auth'
import { motion, AnimatePresence } from 'framer-motion'

const TASKPAY_URL = 'https://farcaster.xyz/miniapps/yfZqr7DiqHjC/taskpay'

export default function TaskpayBanner() {
  const { address } = useAccount()
  const { context } = useMiniAppContext()
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 800)
    return () => clearTimeout(timer)
  }, [])

  const close = () => setShow(false)

  const openTaskpay = async () => {
    setLoading(true)
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk')
      await sdk.actions.openMiniApp({ url: TASKPAY_URL })

      if (address && (context as any)?.user?.fid) {
        try {
          await authenticatedFetch('/api/mini-app-reward', {
            method: 'POST',
            body: JSON.stringify({
              userAddress: address,
              fid: (context as any).user.fid,
            }),
          })
        } catch {
          // Reward claim is best-effort
        }
      }
      close()
    } catch (error) {
      console.error('Failed to open Taskpay:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              className="w-full max-w-[320px] pointer-events-auto"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            >
            <div
              className="relative rounded-2xl border border-amber-400/50 bg-gradient-to-br from-amber-500/30 via-orange-500/25 to-yellow-500/30 backdrop-blur-xl p-4 shadow-2xl"
              style={{
                boxShadow: '0 8px 32px -4px rgba(251, 191, 36, 0.4), 0 0 24px rgba(249, 115, 22, 0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={close}
                className="absolute right-2 top-2 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>

              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white shadow-lg flex items-center justify-center overflow-hidden border border-amber-300/60">
                  <img src="/images/taskpay.png" alt="Taskpay" className="w-11 h-11 object-contain" />
                </div>
                <div className="text-center px-1">
                  <p className="text-sm font-bold text-white leading-tight">Quests. Rewards. Real money. That’s Taskpay.</p>
                  <p className="text-xs text-amber-100/95 mt-1.5 leading-tight">
                    <FontAwesomeIcon icon={faCoins} className="mr-1 text-amber-300 text-[10px]" />
                    <span className="font-semibold text-amber-200">$65</span> up for grabs — complete quests and claim your cut before they’re gone.
                  </p>
                </div>
                <motion.button
                  onClick={openTaskpay}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg hover:from-amber-400 hover:to-orange-400 disabled:opacity-70 transition-all border border-amber-300/50"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {loading ? (
                    <motion.div
                      className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faRocket} className="text-[10px]" />
                      <span>Open Taskpay / +2 gift box</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
