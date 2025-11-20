import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from '../../services/authService'

export default function Header() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userRole, setUserRole] = useState('')
  const [userDetails, setUserDetails] = useState('')
  const [branchDetails, setBranchDetails] = useState('')

  const getUserInfo = () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  };

  useEffect(() => {
    const userInfo = getUserInfo()

    setUserDetails(userInfo?.firstName?.en ?? userInfo?.email)
    setBranchDetails(userInfo?.branchName ?? userInfo?.branchUsername)
    setUserRole(userInfo?.roleName)
  }, [])
  

  return (
    <nav className="flex items-center justify-between py-2 px-4 bg-[#232323] z-25 relative">
      {/* Mobile Menu Button */}
      <button className="flex items-center space-x-2 text-white font-medium md:block lg:hidden">
        <Menu className="w-6 h-6" />
        <span>Menu</span>
      </button>

      {/* Right Section */}
      <div className="flex items-center space-x-4 ml-auto">
        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="hover:opacity-80 transition-opacity flex items-center space-x-2 cursor-pointer"
          >
            <div className="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-[#BBA473] rounded-full cursor-pointer">
              <span className="font-medium text-black">MA</span>
            </div>
            <div className="text-left">
              <h4 className="text-gray-50 font-semibold">{userDetails  ?? branchDetails ?? 'Anonymous'}</h4>
              {branchDetails ? '' : <h4 className="text-gray-50">{userRole ?? 'Anonymous'}</h4>}
            </div>
          </button>

          {/* Dropdown Menu */}
          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
              <ul className="py-1 text-gray-700">
                <li>
                  <button
                    onClick={() => console.log("Change Password clicked")}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    Change Password
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      logoutUser()
                      navigate('/');
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
