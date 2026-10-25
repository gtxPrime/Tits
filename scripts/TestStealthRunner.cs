using System;
using System.Diagnostics;
using System.IO;

namespace TitsTestStealth {
    class Program {
        static int Main(string[] args) {
            Console.Title = "TITS - Stealth Diagnostic Runner";
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            
            // Locate script
            string scriptPath = Path.Combine(baseDir, "scripts", "test_stealth.js");
            if (!File.Exists(scriptPath)) {
                scriptPath = Path.Combine(baseDir, "test_stealth.js");
            }
            if (!File.Exists(scriptPath)) {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("[Error] Cannot locate scripts\\test_stealth.js in " + baseDir);
                Console.ResetColor();
                Console.WriteLine("\nPress Enter to exit...");
                Console.ReadLine();
                return 1;
            }

            // Locate electron binary
            string electronLocal = Path.Combine(baseDir, "node_modules", "electron", "dist", "electron.exe");
            ProcessStartInfo psi = new ProcessStartInfo();
            psi.WorkingDirectory = baseDir;
            psi.UseShellExecute = false;

            if (File.Exists(electronLocal)) {
                psi.FileName = electronLocal;
                psi.Arguments = "\"" + scriptPath + "\"";
            } else {
                psi.FileName = "cmd.exe";
                psi.Arguments = "/c npx electron \"" + scriptPath + "\"";
            }

            try {
                using (Process proc = Process.Start(psi)) {
                    proc.WaitForExit();
                    Console.WriteLine("\n======================================================");
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("   Execution finished with code: " + proc.ExitCode);
                    Console.ResetColor();
                    Console.WriteLine("======================================================");
                    Console.WriteLine("Press Enter to exit...");
                    Console.ReadLine();
                    return proc.ExitCode;
                }
            } catch (Exception ex) {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("[Error] Failed to execute test: " + ex.Message);
                Console.ResetColor();
                Console.WriteLine("Press Enter to exit...");
                Console.ReadLine();
                return 1;
            }
        }
    }
}
