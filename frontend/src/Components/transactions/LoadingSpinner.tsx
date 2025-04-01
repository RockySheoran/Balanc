/** @format */
import { motion } from "framer-motion"

const LoadingSpinner = ({
  size = 48,
  color = "#3B82F6",
}: {
  size?: number
  color?: string
}) => {
  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        repeat: Infinity,
        duration: 1,
        ease: "linear",
      },
    },
  }

  const circleVariants = {
    animate: {
      opacity: [0.2, 1, 0.2],
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: "easeInOut",
      },
    },
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 38 38"
        xmlns="http://www.w3.org/2000/svg"
        animate="animate"
        variants={spinnerVariants}>
        <defs>
          <linearGradient x1="8.042%" y1="0%" x2="65.682%" y2="23.865%" id="a">
            <stop stopColor={color} stopOpacity="0" offset="0%" />
            <stop stopColor={color} stopOpacity=".631" offset="63.146%" />
            <stop stopColor={color} offset="100%" />
          </linearGradient>
        </defs>
        <g fill="none" fillRule="evenodd">
          <g transform="translate(1 1)">
            <path
              d="M36 18c0-9.94-8.06-18-18-18"
              stroke="url(#a)"
              strokeWidth="2">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 18 18"
                to="360 18 18"
                dur="0.9s"
                repeatCount="indefinite"
              />
            </path>
            <motion.circle
              cx="36"
              cy="18"
              r="1"
              fill={color}
              variants={circleVariants}>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 18 18"
                to="360 18 18"
                dur="0.9s"
                repeatCount="indefinite"
              />
            </motion.circle>
          </g>
        </g>
      </motion.svg>
      <motion.p
        className="text-sm text-gray-500 dark:text-gray-400"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity }}>
        Loading transactions...
      </motion.p>
    </div>
  )
}

export default LoadingSpinner
