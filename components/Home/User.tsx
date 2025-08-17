import { useFrame } from '@/components/farcaster-provider'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faUsers, faIdCard } from '@fortawesome/free-solid-svg-icons'
import { motion } from 'framer-motion'

export function User() {
  const { context } = useFrame()

  return (
    <motion.div 
      className="relative overflow-hidden border border-[#00FFAA]/40 backdrop-blur-sm p-6 text-white"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ borderColor: "rgba(0, 255, 170, 0.6)" }}
    >
      {/* Header with Icon */}
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 border border-[#00FFAA] flex items-center justify-center mr-4">
          <FontAwesomeIcon icon={faUser} className="text-[#00FFAA]" />
        </div>
        <div className="flex-grow">
          <h2 className="text-xl font-bold text-[#00FFAA] uppercase tracking-wider">User Context</h2>
          <div className="h-[1px] w-full bg-gradient-to-r from-[#00FFAA]/50 to-transparent mt-2"></div>
        </div>
      </div>

      {context?.user ? (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-2 border-[#00FFAA]/50 overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600">
                {context?.user?.pfpUrl ? (
                  <img
                    src={context?.user?.pfpUrl}
                    className="w-full h-full object-cover"
                    alt="User Profile"
                    width={80}
                    height={80}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faUsers} className="text-2xl text-white" />
                  </div>
                )}
              </div>
              {/* Active indicator */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#00FFAA] rounded-full border-2 border-black flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60 flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} className="text-xs" />
                  Display Name
                </span>
                <span className="bg-[#00FFAA]/10 border border-[#00FFAA]/30 font-mono text-[#00FFAA] rounded-md px-3 py-1 text-sm">
                  {context?.user?.displayName}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60 flex items-center gap-2">
                  <span className="text-xs">@</span>
                  Username
                </span>
                <span className="bg-[#00FFAA]/10 border border-[#00FFAA]/30 font-mono text-[#00FFAA] rounded-md px-3 py-1 text-sm">
                  {context?.user?.username}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60 flex items-center gap-2">
                  <FontAwesomeIcon icon={faIdCard} className="text-xs" />
                  User ID
                </span>
                <span className="bg-[#00FFAA]/10 border border-[#00FFAA]/30 font-mono text-[#00FFAA] rounded-md px-3 py-1 text-sm">
                  {context?.user?.fid}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 border border-[#00FFAA]/30 flex items-center justify-center">
            <FontAwesomeIcon icon={faUser} className="text-2xl text-[#00FFAA]/50" />
          </div>
          <p className="text-white/60">User context not available</p>
          <p className="text-sm text-white/40 mt-2">Connect your wallet to view user details</p>
        </div>
      )}
      
      {/* Corner accents */}
      <div className="absolute top-0 right-0 w-10 h-[1px] bg-[#00FFAA]/30" />
      <div className="absolute top-0 right-0 h-10 w-[1px] bg-[#00FFAA]/30" />
      <div className="absolute bottom-0 left-0 w-10 h-[1px] bg-[#00FFAA]/30" />
      <div className="absolute bottom-0 left-0 h-10 w-[1px] bg-[#00FFAA]/30" />
    </motion.div>
  )
}
