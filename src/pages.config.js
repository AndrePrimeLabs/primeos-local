// @ts-nocheck
/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIAssistant from './pages/AIAssistant';
import AIInsights from './pages/AIInsights';
import Activities from './pages/Activities';
import AdminPanel from './pages/AdminPanel';
import AdvancedReports from './pages/AdvancedReports';
import Agenda from './pages/Agenda';
import Analytics from './pages/Analytics';
import AppointmentReports from './pages/AppointmentReports';
import Apps from './pages/Apps';
import BusinessModelCanvas from './pages/BusinessModelCanvas';
import CRM from './pages/CRM';
import CRMAgenda from './pages/CRMAgenda';
import CRMAvancado from './pages/CRMAvancado';
import Campanhas from './pages/Campanhas';
import Canais from './pages/Canais';
import Catalogo from './pages/Catalogo';
import Channels from './pages/Channels';
import ClientPortal from './pages/ClientPortal';
import ContentCreator from './pages/ContentCreator';
import Conteudos from './pages/Conteudos';
import CostStructure from './pages/CostStructure';
import CustomerPipeline from './pages/CustomerPipeline';
import CustomerRelationships from './pages/CustomerRelationships';
import CustomerSegments from './pages/CustomerSegments';
import CustomerSupport from './pages/CustomerSupport';
import Dashboard from './pages/Dashboard';
import DashboardFinanceiro from './pages/DashboardFinanceiro';
import EHR from './pages/EHR';
import EHRIntegration from './pages/EHRIntegration';
import EmailAutomation from './pages/EmailAutomation';
import Estrategias from './pages/Estrategias';
import Financeiro from './pages/Financeiro';
import FollowUpAutomation from './pages/FollowUpAutomation';
import Gamification from './pages/Gamification';
import Inventory from './pages/Inventory';
import InventoryReports from './pages/InventoryReports';
import JornadaCliente from './pages/JornadaCliente';
import JourneyMapping from './pages/JourneyMapping';
import KeyActivities from './pages/KeyActivities';
import KeyPartnerships from './pages/KeyPartnerships';
import KeyResources from './pages/KeyResources';
import LeadsPipeline from './pages/LeadsPipeline';
import MarketingAutomation from './pages/MarketingAutomation';
import MarketingOS from './pages/MarketingOS';
import Metricas from './pages/Metricas';
import MeuAgendamento from './pages/MeuAgendamento';
import OnlineBooking from './pages/OnlineBooking';
import POPs from './pages/POPs';
import PatientPipeline from './pages/PatientPipeline';
import Patients from './pages/Patients';
import PrimeOS from './pages/PrimeOS';
import Prontuarios from './pages/Prontuarios';
import Revenue from './pages/Revenue';
import RevenueStreams from './pages/RevenueStreams';
import SOPs from './pages/SOPs';
import Sales from './pages/Sales';
import SalesPipeline from './pages/SalesPipeline';
import SalesReports from './pages/SalesReports';
import ScriptsVendas from './pages/ScriptsVendas';
import Strategy from './pages/Strategy';
import TaskCalendar from './pages/TaskCalendar';
import Tasks from './pages/Tasks';
import ValueProposition from './pages/ValueProposition';
import DatabaseMap from './pages/DatabaseMap';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "AIInsights": AIInsights,
    "Activities": Activities,
    "AdminPanel": AdminPanel,
    "AdvancedReports": AdvancedReports,
    "Agenda": Agenda,
    "Analytics": Analytics,
    "AppointmentReports": AppointmentReports,
    "Apps": Apps,
    "BusinessModelCanvas": BusinessModelCanvas,
    "CRM": CRM,
    "CRMAgenda": CRMAgenda,
    "CRMAvancado": CRMAvancado,
    "Campanhas": Campanhas,
    "Canais": Canais,
    "Catalogo": Catalogo,
    "Channels": Channels,
    "ClientPortal": ClientPortal,
    "ContentCreator": ContentCreator,
    "Conteudos": Conteudos,
    "CostStructure": CostStructure,
    "CustomerPipeline": CustomerPipeline,
    "CustomerRelationships": CustomerRelationships,
    "CustomerSegments": CustomerSegments,
    "CustomerSupport": CustomerSupport,
    "Dashboard": Dashboard,
    "DashboardFinanceiro": DashboardFinanceiro,
    "EHR": EHR,
    "EHRIntegration": EHRIntegration,
    "EmailAutomation": EmailAutomation,
    "Estrategias": Estrategias,
    "Financeiro": Financeiro,
    "FollowUpAutomation": FollowUpAutomation,
    "Gamification": Gamification,
    "Inventory": Inventory,
    "InventoryReports": InventoryReports,
    "JornadaCliente": JornadaCliente,
    "JourneyMapping": JourneyMapping,
    "KeyActivities": KeyActivities,
    "KeyPartnerships": KeyPartnerships,
    "KeyResources": KeyResources,
    "LeadsPipeline": LeadsPipeline,
    "MarketingAutomation": MarketingAutomation,
    "MarketingOS": MarketingOS,
    "Metricas": Metricas,
    "MeuAgendamento": MeuAgendamento,
    "OnlineBooking": OnlineBooking,
    "POPs": POPs,
    "PatientPipeline": PatientPipeline,
    "Patients": Patients,
    "PrimeOS": PrimeOS,
    "Prontuarios": Prontuarios,
    "Revenue": Revenue,
    "RevenueStreams": RevenueStreams,
    "SOPs": SOPs,
    "Sales": Sales,
    "SalesPipeline": SalesPipeline,
    "SalesReports": SalesReports,
    "ScriptsVendas": ScriptsVendas,
    "Strategy": Strategy,
    "TaskCalendar": TaskCalendar,
    "Tasks": Tasks,
    "ValueProposition": ValueProposition,
    "DatabaseMap": DatabaseMap,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
