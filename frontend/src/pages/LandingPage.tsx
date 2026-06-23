import { useNavigate } from 'react-router-dom';
import { MaterialSymbol } from '../shared/components/MaterialSymbol';

export const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-pink-50 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex flex-col items-center justify-center mb-6">
              <img src="/DilMatelogo.jpg" alt="Dil Mate Logo" className="w-24 h-24 md:w-32 md:h-32 shadow-2xl mb-6 object-cover" />
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-pink-500 via-pink-600 to-pink-700 bg-clip-text text-transparent">
                Dil Mate
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-gray-700 mb-4 max-w-2xl mx-auto">
              Find Your Perfect Match
            </p>
            <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-xl mx-auto">
              Connect with amazing people nearby. Start meaningful conversations and build lasting relationships.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                <MaterialSymbol name="download" className="text-2xl" />
                Install App
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white text-pink-600 font-bold text-lg rounded-full border-2 border-pink-600 hover:bg-pink-50 transform hover:scale-105 transition-all duration-200"
              >
                Login
              </button>
            </div>
          </div>

          {/* Hero Image/Mockup */}
          <div className="mt-16 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-4 shadow-lg">
                  <div className="aspect-[9/16] bg-gradient-to-br from-pink-50 to-white rounded-xl flex items-center justify-center">
                    <img src="/DilMatelogo.jpg" alt="Dil Mate" className="w-32 h-32 object-cover shadow-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">
            Why Choose Dil Mate?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 rounded-2xl hover:bg-pink-50 transition-colors">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MaterialSymbol name="location_on" size={40} className="text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Location-Based Matching</h3>
              <p className="text-gray-600">
                Discover people nearby and connect with matches in your area.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 rounded-2xl hover:bg-pink-50 transition-colors">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MaterialSymbol name="chat_bubble" size={40} className="text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Real-Time Messaging</h3>
              <p className="text-gray-600">
                Chat instantly with your matches and build meaningful connections.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 rounded-2xl hover:bg-pink-50 transition-colors">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MaterialSymbol name="verified" size={40} className="text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Verified Profiles</h3>
              <p className="text-gray-600">
                Connect with verified users for a safe and authentic dating experience.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6 rounded-2xl hover:bg-pink-50 transition-colors">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MaterialSymbol name="security" size={40} className="text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Safe & Secure</h3>
              <p className="text-gray-600">
                Your privacy and safety are our top priorities.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="text-center p-6 rounded-2xl hover:bg-pink-50 transition-colors">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MaterialSymbol name="groups" size={40} className="text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Large Community</h3>
              <p className="text-gray-600">
                Join thousands of active users looking for meaningful connections.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="text-center p-6 rounded-2xl hover:bg-pink-50 transition-colors">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MaterialSymbol name="favorite" size={40} className="text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Smart Matching</h3>
              <p className="text-gray-600">
                Our algorithm helps you find compatible matches based on your preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-pink-500 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Find Your Match?
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Join Dil Mate today and start your journey to meaningful connections.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-10 py-5 bg-white text-pink-600 font-bold text-xl rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center gap-3 mx-auto"
          >
            <MaterialSymbol name="download" className="text-2xl" />
            Install App Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent">
                Dil Mate
              </h3>
              <p className="text-gray-400">
                Find your perfect match today.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-pink-400">About</a></li>
                <li><a href="#" className="hover:text-pink-400">Careers</a></li>
                <li><a href="#" className="hover:text-pink-400">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-pink-400">Help Center</a></li>
                <li><a href="#" className="hover:text-pink-400">Safety</a></li>
                <li><a href="#" className="hover:text-pink-400">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-pink-400">Privacy</a></li>
                <li><a href="#" className="hover:text-pink-400">Terms</a></li>
                <li><a href="#" className="hover:text-pink-400">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Dil Mate. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

